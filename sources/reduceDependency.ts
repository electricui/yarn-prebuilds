import { Descriptor, Locator, MessageName, Project, ResolveOptions, structUtils } from '@yarnpkg/core'

import { Resolver } from 'dns'

export const reduceDependency = async (
  dependency: Descriptor,
  project: Project,
  locator: Locator,
  initialDependency: Descriptor,
  extra: { resolver: Resolver; resolveOptions: ResolveOptions },
) => {
  // We don't have an engines check yet, so do it manually here
  if (locator.name === `fsevents` && process.platform !== `darwin`) return dependency

  if (dependency.name === `bindings` && dependency.scope === null) {
    const descriptor = structUtils.makeDescriptor(
      dependency,
      structUtils.makeRange({
        protocol: `prebuild:`,
        source: structUtils.stringifyDescriptor(dependency),
        selector: `bindings<${structUtils.stringifyLocator(locator)}>`,
        params: null,
      }),
    )

    // extra.resolveOptions.report.reportInfo(
    //   MessageName.UNNAMED,
    //   `Found a bindings dependency in ${structUtils.stringifyLocator(locator)}, re-routing to prebuild under name ${
    //     descriptor.name
    //   }`,
    // )

    return descriptor
  }

  return dependency
}
