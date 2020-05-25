import {Hooks as CoreHooks, Plugin, SettingsType, SettingsDefinition} from '@yarnpkg/core';

import {reduceDependency}                                             from './add-prebuilt-dependencies';
import {PrebuildFetcher}                                              from './fetcher';
import {PrebuildResolver}                                             from './resolver';


const prebuildSettings: {[name: string]: SettingsDefinition} = {
  prebuildRuntime: {
    description: `The runtime used, either 'electron' or 'node'`,
    type: SettingsType.STRING,
    default: null,
  },
  prebuildAbi: {
    description: `The ABI of the runtime used.`,
    type: SettingsType.STRING,
    default: null,
  },
  prebuildTagPrefix: {
    description: `The prebuild tag prefix`,
    type: SettingsType.STRING,
    default: `v`,
  },
  prebuildHostMirrorUrl: {
    description: `The prebuild host mirror URL`,
    type: SettingsType.STRING,
    default: null,
  },
  prebuildHostMirrorTemplate: {
    description: `The prebuild host mirror template`,
    type: SettingsType.STRING,
    default: `{mirror_url}/{tag_prefix}{version}/{name}-v{version}-{runtime}-v{abi}-{platform}{libc}-{arch}.tar.gz`,
  },
};

const plugin: Plugin<CoreHooks> = {
  hooks: {
    reduceDependency,
  },
  fetchers: [
    PrebuildFetcher,
  ],
  resolvers: [
    PrebuildResolver,
  ],
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
};

// eslint-disable-next-line arca/no-default-export
export default plugin;
