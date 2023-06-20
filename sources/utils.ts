import { Configuration, Ident, MessageName, Package, Project, ReportError, structUtils } from '@yarnpkg/core'
import { FakeFS, PortablePath, ppath } from '@yarnpkg/fslib'

import { MapLike } from 'typescript'
import { getAbi } from 'node-abi'
import { npmHttpUtils } from '@yarnpkg/plugin-npm'

export const getElectronVersion = async (project: Project) => {
  for (const pkg of project.storedPackages.values()) {
    if (pkg.name === `electron`) {
      return pkg.version
    }
  }

  return null
}

export const getNativeModule = async (project: Project, packageIdent: Ident, ident: Ident) => {
  // we need to find the package that matches packageIdent which has a dependency on our ephemeral bindings package
  for (const pkg of project.storedPackages.values()) {
    // see if it matches packageIdent
    if (pkg.name === packageIdent.name && pkg.scope === packageIdent.scope) {
      //for (const [identHash, dependency] of pkg.dependencies) {
      //  if (dependency.name === "bindings") {
      return pkg
      //  }
      //}
    }
  }

  return null
}

export function parseSpec(spec: string) {
  const payload = spec.substring(spec.indexOf(`builtin<prebuild/`) + 17, spec.length - 1)
  const packageIdent = structUtils.parseIdent(payload)
  return { packageIdent }
}

export function getPrebuildConfiguration(scope: string, configuration: Configuration): MapLike<any> | null {
  const prebuildScopedConfigurations: Map<string, MapLike<any>> = configuration.get(`prebuildScopes`)

  const exactEntry = prebuildScopedConfigurations.get(scope)
  if (typeof exactEntry !== `undefined`) return exactEntry

  return null
}

export function gitRepositoryToGithubLink(repository: string) {
  var m = /github\.com\/([^\/]+)\/([^\/\.]+)\.git/.exec(repository)
  if (m) return `https://github.com/${m[1]}/${m[2]}`

  return null
}

function getConfigEntry<T>(nativeModule: Package, entry: string, project: Project): T {
  const configuration = project.configuration

  const scopeWithAt = `@${nativeModule.scope}`

  const scopedConfiguration = nativeModule.scope ? getPrebuildConfiguration(scopeWithAt, configuration) : null

  const effectiveConfiguration = scopedConfiguration || configuration

  if (effectiveConfiguration.get(entry)) return effectiveConfiguration.get(entry)

  return configuration.get(entry) as T
}

export function getElectronABI(electronVersion: string): string {
  return getAbi(electronVersion, `electron`)
}

export interface PrebuildCalculatedOptions {
  runtime: string | 'node' | 'electron'
  abi: string
}

function runTemplate(template: string, templateValues: { [key: string]: string }) {
  for (const [key, value] of Object.entries(templateValues))
    template = template.replace(new RegExp(`{${key}}`, `g`), value)

  return template
}

async function getGithubLink(nativeModule: Package, project: Project) {
  const registryData = await npmHttpUtils.get(npmHttpUtils.getIdentUrl(nativeModule), {
    configuration: project.configuration,
    ident: nativeModule,
  })

  if (!Object.prototype.hasOwnProperty.call(registryData, `versions`))
    throw new ReportError(MessageName.REMOTE_INVALID, `Registry returned invalid data for - missing "versions" field`)

  if (!Object.prototype.hasOwnProperty.call(registryData.versions, nativeModule!.version!))
    throw new ReportError(MessageName.REMOTE_NOT_FOUND, `Registry failed to return reference "${nativeModule.version}"`)

  const data = registryData.versions[nativeModule!.version!]
  const repository = data.repository?.url

  if (!repository)
    throw new ReportError(
      MessageName.UNNAMED,
      `Unable to find repository information for "${structUtils.stringifyIdent(nativeModule)}"`,
    )

  const githubUrl = gitRepositoryToGithubLink(repository)

  if (!githubUrl)
    throw new ReportError(
      MessageName.UNNAMED,
      `Unable to find GitHub URL for "${structUtils.stringifyIdent(nativeModule)}"`,
    )

  return githubUrl
}

/**
 * This renames `arm` to `armv7l` to be consistent with the prebuild artifacts
 */
export function normalisedArch() {
  switch (process.arch) {
    case `arm`:
      return `armv7l`

    default:
      return process.arch
  }
}

export async function getUrlOfPrebuild(
  nativeModule: Package,
  project: Project,
  prebuildOpts: PrebuildCalculatedOptions,
) {
  const convertedName = structUtils.stringifyIdent(nativeModule).replace(/^@\w+\//, ``)

  const name = convertedName

  const version = nativeModule.version!
  const abi = prebuildOpts.abi
  const runtime = prebuildOpts.runtime
  const platform = process.platform
  const arch = normalisedArch()
  const libc = process.env.LIBC || ``
  // eslint-disable-next-line @typescript-eslint/camelcase
  const tag_prefix = getConfigEntry<string>(nativeModule, `prebuildTagPrefix`, project)

  const packageName = `${name}-v${version}-${runtime}-v${abi}-${platform}${libc}-${arch}.tar.gz`
  // eslint-disable-next-line @typescript-eslint/camelcase
  const mirror_url = getConfigEntry<string>(nativeModule, `prebuildHostMirrorUrl`, project)

  // eslint-disable-next-line @typescript-eslint/camelcase
  if (mirror_url) {
    const template = getConfigEntry<string>(nativeModule, `prebuildHostMirrorTemplate`, project)

    return runTemplate(template, {
      // eslint-disable-next-line @typescript-eslint/camelcase
      mirror_url,
      name,
      version,
      abi,
      runtime,
      platform,
      arch,
      libc,
      // eslint-disable-next-line @typescript-eslint/camelcase
      tag_prefix,
      scope: nativeModule.scope || ``,
      scopeWithAt: nativeModule.scope ? `@${nativeModule.scope}` : ``,
      scopeWithAtAndSlash: nativeModule.scope ? `@${nativeModule.scope}/` : ``,
      scopeWithSlash: nativeModule.scope ? `${nativeModule.scope}/` : ``,
    })
  }

  const githubLink = await getGithubLink(nativeModule, project)

  // eslint-disable-next-line @typescript-eslint/camelcase
  return `${githubLink}/releases/download/${tag_prefix}${version}/${packageName}`
}

export const walk = async (
  filesystem: FakeFS<PortablePath>,
  currentPath: PortablePath,
  callback: (filesystem: FakeFS<PortablePath>, filepath: PortablePath) => Promise<void>,
  cancellationSignal: { cancel: boolean },
) => {
  if (cancellationSignal.cancel) return

  const files = await filesystem.readdirPromise(currentPath)

  await Promise.all(
    files.map(async filename => {
      if (cancellationSignal.cancel) return

      const filepath = ppath.join(currentPath, filename)

      const stat = await filesystem.statPromise(filepath)

      if (stat.isDirectory()) {
        await walk(filesystem, filepath, callback, cancellationSignal)
      } else if (stat.isFile()) {
        await callback(filesystem, filepath)
      }
    }),
  )
}
