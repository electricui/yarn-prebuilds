import {Descriptor, Locator, Package, Resolver, ResolveOptions, MinimalResolveOptions, DescriptorHash, LinkType, structUtils} from '@yarnpkg/core';


export class PrebuildResolver implements Resolver {
  supportsDescriptor(descriptor: Descriptor, opts: MinimalResolveOptions) {
    if (!descriptor.range.startsWith(`prebuild:`))
      return false;

    return true;
  }

  supportsLocator(locator: Locator, opts: MinimalResolveOptions) {
    if (!locator.reference.startsWith(`prebuild:`))
      return false;

    return true;
  }

  shouldPersistResolution(locator: Locator, opts: MinimalResolveOptions) {
    return false;
  }

  bindDescriptor(descriptor: Descriptor, fromLocator: Locator, opts: MinimalResolveOptions) {
    return descriptor;
  }

  getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions) {
    return [];
  }

  async getCandidates(descriptor: Descriptor, dependencies: Map<DescriptorHash, Package>, opts: ResolveOptions) {
    if (!opts.fetchOptions)
      throw new Error(`Assertion failed: This resolver cannot be used unless a fetcher is configured`);

    return [structUtils.makeLocator(structUtils.parseIdent(`bindings`), descriptor.range)];
  }

  async resolve(locator: Locator, opts: ResolveOptions): Promise<Package> {
    // We have to defer all the actual resolution until the rest of the tree is figured out
    // We'll figure out our actual node files in the fetch step once everything else is resolved.
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
    };
  }
}
