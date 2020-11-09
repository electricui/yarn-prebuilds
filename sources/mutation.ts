import { CwdFS, Filename, PortablePath, ZipOpenFS } from '@yarnpkg/fslib'
import {
  FetchResult,
  Locator,
  Manifest,
  MessageName,
  Package,
  Project,
  ReportError,
  StreamReport,
  miscUtils,
  structUtils,
} from '@yarnpkg/core'
import { PrebuildCalculatedOptions, getElectronABI, getUrlOfPrebuild, normalisedArch, walk } from './utils'

import { InstallOptions } from '@yarnpkg/core/lib/Project'
import { PassThrough } from 'stream'
import { getLibzipPromise } from '@yarnpkg/libzip'
import { ppath } from '@yarnpkg/fslib'

export async function mutatePackage(
  pkg: Package,
  binding: Package,
  project: Project,
  opts: InstallOptions,
  electronVersion: string | null,
) {
  const { packageLocation, packageFs } = await initializePackageEnvironment(binding, project)

  const prebuildOptions: PrebuildCalculatedOptions = {
    abi: electronVersion ? getElectronABI(electronVersion) : process.versions.modules,
    runtime: electronVersion ? `electron` : `node`,
  }

  // fsevents is bound to node, not to Electron
  if (pkg.name === 'fsevents' && pkg.scope === null) {
    prebuildOptions.abi = process.versions.modules
    prebuildOptions.runtime = `node`
  }

  const prebuildHashEntropy = `${structUtils.stringifyIdent(pkg)}-${pkg.version}-${
    process.platform
  }-${normalisedArch()}-${prebuildOptions.runtime}-${prebuildOptions.abi}`.replace(/\//g, '-')

  // Check if the cache key exists / matches
  const cacheKeyLocation = ppath.join(packageLocation, `cacheKey.js` as Filename)
  if (await packageFs.existsPromise(cacheKeyLocation)) {
    const cacheKey = (await packageFs.readFilePromise(cacheKeyLocation)).toString()

    if (cacheKey === prebuildHashEntropy) {
      // We've already done this, we can skip it.
      opts.report.reportInfo(
        MessageName.UNNAMED,
        `${structUtils.stringifyLocator(pkg)} cache keys match, skipping installation`,
      )
      return
    }
  }

  const prebuildUrl = await getUrlOfPrebuild(pkg, project, prebuildOptions)

  const fetcher = project.configuration.makeFetcher()

  let prebuildPackage: FetchResult
  try {
    prebuildPackage = await fetcher.fetch(
      structUtils.makeLocator(structUtils.makeIdent(`prebuilds`, prebuildHashEntropy), prebuildUrl),
      {
        cache: opts.cache,
        checksums: project.storedChecksums,
        report: opts.report,
        project: project,
        fetcher: fetcher,
      },
    )
  } catch (e) {
    opts.report.reportInfo(MessageName.UNNAMED, `Error fetching ${prebuildUrl}`)
    throw e
  }

  const cancellationSignal = { cancel: false }
  let nodeContents: Buffer | null = null
  let bindingsLocation = ``

  // Walk the downloaded prebuild directory, find the file
  await miscUtils.releaseAfterUseAsync(async () => {
    await walk(
      prebuildPackage.packageFs,
      `.` as PortablePath,
      async (filesystem, filepath) => {
        nodeContents = await filesystem.readFilePromise(filepath)
        bindingsLocation = filepath

        // send the break signal
        cancellationSignal.cancel = true
      },
      cancellationSignal,
    )
  }, prebuildPackage.releaseFs)

  if (nodeContents === null)
    throw new ReportError(
      MessageName.UNNAMED,
      `Was unable to find node file in prebuild package for "${structUtils.stringifyIdent(pkg)}"`,
    )

  // Write our package.json
  await packageFs.writeJsonPromise(ppath.join(packageLocation, `package.json` as Filename), {
    name: structUtils.slugifyLocator(binding),
    main: `./index.js`,
  })

  // write our index.js
  const templateIndex = `// Automatically generated bindings file for ${structUtils.stringifyIdent(pkg)}
// Package version: ${pkg.version}
// Runtime: ${prebuildOptions.runtime}, ABI: ${prebuildOptions.abi}
// Bindings taken from: ${bindingsLocation}

const staticRequire = require("./bindings.node");
module.exports = (fileLookingFor) => {
  return staticRequire;
};
`
  await packageFs.writeFilePromise(ppath.join(packageLocation, `index.js` as Filename), templateIndex)

  // Write the file into the generated package
  await packageFs.writeFilePromise(ppath.join(packageLocation, `bindings.node` as Filename), nodeContents)

  // Write the cache key
  await packageFs.writeFilePromise(cacheKeyLocation, prebuildHashEntropy)

  opts.report.reportInfo(MessageName.UNNAMED, `Installed prebuild for ${structUtils.stringifyLocator(pkg)}`)
}

async function initializePackageEnvironment(locator: Locator, project: Project) {
  const pkg = project.storedPackages.get(locator.locatorHash)
  if (!pkg)
    throw new Error(`Package for ${structUtils.prettyLocator(project.configuration, locator)} not found in the project`)

  return await ZipOpenFS.openPromise(
    async (zipOpenFs: ZipOpenFS) => {
      const configuration = project.configuration

      const linkers = project.configuration.getLinkers()
      const linkerOptions = { project, report: new StreamReport({ stdout: new PassThrough(), configuration }) }

      const linker = linkers.find(linker => linker.supportsPackage(pkg, linkerOptions))
      if (!linker)
        throw new Error(
          `The package ${structUtils.prettyLocator(
            project.configuration,
            pkg,
          )} isn't supported by any of the available linkers`,
        )

      const packageLocation = await linker.findPackageLocation(pkg, linkerOptions)
      const packageFs = new CwdFS(packageLocation, { baseFs: zipOpenFs })

      return { packageLocation, packageFs }
    },
    {
      libzip: await getLibzipPromise(),
    },
  )
}
