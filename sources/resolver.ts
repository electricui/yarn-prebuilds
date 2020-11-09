import {
  Descriptor,
  DescriptorHash,
  LinkType,
  Locator,
  MinimalResolveOptions,
  Package,
  ResolveOptions,
  Resolver,
  structUtils,
} from '@yarnpkg/core'

export class PrebuildResolver implements Resolver {
  supportsDescriptor(descriptor: Descriptor, opts: MinimalResolveOptions) {
    if (!descriptor.range.startsWith(`prebuild:`)) return false

    return true
  }

  supportsLocator(locator: Locator, opts: MinimalResolveOptions) {
    if (!locator.reference.startsWith(`prebuild:`)) return false

    return true
  }

  shouldPersistResolution(locator: Locator, opts: MinimalResolveOptions) {
    return false
  }

  bindDescriptor(descriptor: Descriptor, fromLocator: Locator, opts: MinimalResolveOptions) {
    return descriptor
  }

  getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions) {
    return []
  }

  async getCandidates(descriptor: Descriptor, dependencies: Map<DescriptorHash, Package>, opts: ResolveOptions) {
    if (!opts.fetchOptions)
      throw new Error(`Assertion failed: This resolver cannot be used unless a fetcher is configured`)

    return [structUtils.makeLocator(structUtils.parseIdent(`bindings`), descriptor.range)]
  }

  async getSatisfying(descriptor: Descriptor, references: Array<string>, opts: ResolveOptions) {
    return null
  }

  async resolve(locator: Locator, opts: ResolveOptions): Promise<Package> {
    return {
      ...locator,

      version: `*`,

      languageName: opts.project.configuration.get(`defaultLanguageName`),
      linkType: LinkType.HARD,

      dependencies: new Map(),
      peerDependencies: new Map(),

      dependenciesMeta: new Map(),
      peerDependenciesMeta: new Map(),

      bin: new Map(),
    }
  }
}
