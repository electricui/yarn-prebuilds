import { miscUtils, Plugin, SettingsType } from '@yarnpkg/core'

import { PrebuildFetcher } from './fetcher'
import { PrebuildResolver } from './resolver'
import { afterAllInstalled } from './afterAllInstalled'
import { reduceDependency } from './reduceDependency'

/**
 * Intercept all dependencies on bindings, rewrite them to a blank package.
 *
 * During a post-link step, replace all bindings with a statically linked one to the OS' prebuilt files.
 */

const prebuildSettings = {
  prebuildRuntime: {
    description: `The runtime used, either 'electron' or 'node'`,
    type: SettingsType.STRING as const,
    default: null,
  },
  prebuildAbi: {
    description: `The ABI of the runtime used.`,
    type: SettingsType.STRING as const,
    default: null,
  },
  prebuildTagPrefix: {
    description: `The prebuild tag prefix`,
    type: SettingsType.STRING as const,
    default: `v`,
  },
  prebuildHostMirrorUrl: {
    description: `The prebuild host mirror URL`,
    type: SettingsType.STRING as const,
    default: null,
  },
  prebuildHostMirrorTemplate: {
    description: `The prebuild host mirror template`,
    type: SettingsType.STRING as const,
    default: `{mirror_url}/{tag_prefix}{version}/{name}-v{version}-{runtime}-v{abi}-{platform}{libc}-{arch}.tar.gz`,
  },
}

declare module '@yarnpkg/core' {
  interface ConfigurationValueMap {
    prebuildRuntime: string | null
    prebuildAbi: string | null
    prebuildTagPrefix: string
    prebuildHostMirrorUrl: string | null
    prebuildHostMirrorTemplate: string
    prebuildScopes: Map<
      string,
      miscUtils.ToMapValue<{
        prebuildRuntime: string | null
        prebuildAbi: string | null
        prebuildTagPrefix: string
        prebuildHostMirrorUrl: string | null
        prebuildHostMirrorTemplate: string
      }>
    >
  }
}

const plugin: Plugin = {
  hooks: {
    reduceDependency,
    afterAllInstalled,
  },
  fetchers: [PrebuildFetcher],
  resolvers: [PrebuildResolver],
  configuration: {
    ...prebuildSettings,
    prebuildScopes: {
      description: `Prebuild settings per package scope`,
      type: SettingsType.MAP,
      valueDefinition: {
        description: ``,
        type: SettingsType.SHAPE,
        properties: {
          ...prebuildSettings,
        },
      },
    },
  },
}

export default plugin
