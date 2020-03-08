import {Descriptor, Locator, MessageName, Project, ResolveOptions, Resolver} from '@yarnpkg/core';

import {structUtils}                                                         from '@yarnpkg/core';

export const reduceDependency = async (
  dependency: Descriptor,
  project: Project,
  locator: Locator,
  initialDependency: Descriptor,
  extra: {resolver: Resolver, resolveOptions: ResolveOptions},
) => {
  if (dependency.name === 'bindings' && dependency.scope === null) {
    extra.resolveOptions.report.reportInfo(MessageName.UNNAMED, `Found a bindings dependency in ${structUtils.stringifyIdent(locator)}, re-routing to prebuild.`)

    const selector = `builtin<prebuild/${structUtils.stringifyIdent(locator)}>`

    return structUtils.makeDescriptor(dependency, structUtils.makeRange({
      protocol: `prebuild:`,
      source: `bindings<${structUtils.slugifyIdent(locator)}>${process.platform}-${process.arch}`,
      selector,
      params: null,
    }));
  }

  return dependency
}
