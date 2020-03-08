import * as utils                                                                                         from './utils';

import {CwdFS, Filename, PortablePath, ZipFS, ppath, xfs}                                                 from '@yarnpkg/fslib';
import {FetchOptions, FetchResult, Fetcher, MinimalFetchOptions}                                          from '@yarnpkg/core';
import {Locator, MessageName, ReportError, miscUtils, structUtils}                                        from '@yarnpkg/core';

import {PrebuildCalculatedOptions}                                                                        from './utils';
import {getLibzipPromise}                                                                                 from '@yarnpkg/libzip';

export class PrebuildFetcher implements Fetcher {
  supports(locator: Locator, opts: MinimalFetchOptions) {
    if (!locator.reference.startsWith(`prebuild:`))
      return false;

    return true;
  }

  getLocalPath(locator: Locator, opts: FetchOptions) {
    return null;
  }

  async fetch(locator: Locator, opts: FetchOptions) {
    const expectedChecksum = null // opts.checksums.get(locator.locatorHash) || null;

    const [packageFs, releaseFs, checksum] = await opts.cache.fetchPackageFromCache(
      locator,
      expectedChecksum,
      async () => {
        opts.report.reportInfoOnce(MessageName.FETCH_NOT_CACHED, `${structUtils.prettyLocator(opts.project.configuration, locator)} can't be found in the cache and will be fetched from the registry`);
        return await this.fetchPrebuild(locator, opts);
      },
    );

    return {
      packageFs,
      releaseFs,
      prefixPath: structUtils.getIdentVendorPath(locator),
      localPath: this.getLocalPath(locator, opts),
      checksum,
    };
  }

  private async fetchPrebuild(locator: Locator, opts: FetchOptions) {
    const { packageIdent } = utils.parseSpec(locator.reference);

    const electronVersion = await utils.getElectronVersion(opts.project)

    const nativeModule = await utils.getNativeModule(opts.project, packageIdent, locator)

    if (nativeModule === null) {
      throw new ReportError(MessageName.UNNAMED, `Could not find the native module that had a prebuild attempt`);
    }

    if (nativeModule.version === null) {
      throw new ReportError(MessageName.UNNAMED, `Could not find the native module version that had a prebuild attempt`);
    }

    const prebuildOptions: PrebuildCalculatedOptions = {
      abi: electronVersion ? utils.getElectronABI(electronVersion) : process.versions.modules,
      runtime: electronVersion ? 'electron' : 'node'
    }

    const prebuildUrl = await utils.getUrlOfPrebuild(nativeModule, opts, prebuildOptions)

    let prebuildPackage: FetchResult
    try {
      prebuildPackage = await opts.fetcher.fetch(structUtils.makeLocator(structUtils.makeIdent(`prebuilds`, `${structUtils.slugifyIdent(nativeModule)}-v${nativeModule.version}-${process.platform}-${process.arch}-${prebuildOptions.runtime}-${prebuildOptions.abi}`), prebuildUrl), opts)
    } catch (e) {
      opts.report.reportInfo(MessageName.UNNAMED, `Error fetching ${prebuildUrl}`)
      throw e
    }

    // opts.report.reportInfo(MessageName.UNNAMED, `Fetched prebuild for ${structUtils.stringifyIdent(nativeModule)} version ${nativeModule.version} on runtime electron version ${electronVersion}`)

    const cancellationSignal = { cancel: false }
    let nodeContents: Buffer | null = null
    let bindingsLocation = ""

    // Walk the downloaded prebuild directory, find the file
    await miscUtils.releaseAfterUseAsync(async () => {
      await utils.walk(prebuildPackage.packageFs, '.' as PortablePath, async (filesystem, filepath) => {
        nodeContents = await filesystem.readFilePromise(filepath)
        bindingsLocation = filepath

        // send the break signal
        cancellationSignal.cancel = true
      }, cancellationSignal)
    }, prebuildPackage.releaseFs)

    if (nodeContents === null) {
      throw new ReportError(MessageName.UNNAMED, `Was unable to find node file in prebuild package for "${structUtils.stringifyIdent(nativeModule)}"`);
    }

    const tmpDir = await xfs.mktempPromise();
    const tmpFile = ppath.join(tmpDir, `prebuilt.zip` as Filename);
    const prefixPath = structUtils.getIdentVendorPath(locator);

    const libzip = await getLibzipPromise();

    const zipPackage = new ZipFS(tmpFile, {libzip, create: true});
    await zipPackage.mkdirpPromise(prefixPath);

    const generatedPackage = new CwdFS(prefixPath, {baseFs: zipPackage});

    // Write our package.json
    await generatedPackage.writeJsonPromise('package.json' as Filename, {
      name: structUtils.slugifyLocator(locator),
      main: "./index.js"
    })

    // write our index.js
    const templateIndex = `// Automatically generated bindings file
// Bindings taken from ${bindingsLocation}

const staticRequire = require("./bindings.node");
module.exports = (fileLookingFor) => {
  return staticRequire;
};
    `
    await generatedPackage.writeFilePromise('index.js' as Filename, templateIndex)

    // Write the file into the generated package
    await generatedPackage.writeFilePromise('bindings.node' as Filename, nodeContents)

    return zipPackage;
  }
}
