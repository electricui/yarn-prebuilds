import { DescriptorHash, IdentHash, LocatorHash, MessageName, Package, Project, structUtils } from '@yarnpkg/core'

import { InstallOptions } from '@yarnpkg/core/lib/Project'
import { getElectronVersion } from './utils'
import { mutatePackage } from './mutation'

const sleep = (delay: number) => new Promise((resolve, reject) => setTimeout(resolve, delay))

function isDependencyBindings(pkg: Package) {
  // We don't have an engines check yet, so do it manually here
  if (pkg.name === `fsevents` && process.platform !== `darwin`) {
    return false
  }

  // Only packages named exactly `bindings`, not `scoped@bindings` for example
  if (pkg.name === `bindings` && pkg.scope === null) {
    return true
  }

  return false
}

async function findBindingsDependencies(project: Project, opts: InstallOptions) {
  const bindings: Map<LocatorHash, Package> = new Map()

  // Find the electron version
  const electronVersion = await getElectronVersion(project)
  if (electronVersion) {
    opts.report.reportInfo(MessageName.UNNAMED, `Using Electron runtime v${electronVersion}`)
  }

  // First find the bindings packages
  for (const pkg of project.storedPackages.values()) {
    if (isDependencyBindings(pkg)) {
      bindings.set(pkg.locatorHash, pkg)
    }
  }

  // Then find the packages that depend on them
  for (const pkg of project.storedPackages.values()) {
    for (const [identHash, dep] of pkg.dependencies) {
      // The binding descriptorHash is the pkg locatorHash
      const binding = bindings.get((dep.descriptorHash as string) as LocatorHash)
      if (binding) {
        // this package is dependent on a bindings package, mutate the bindings package
        try {
          await mutatePackage(pkg, binding, project, opts, electronVersion)
        } catch (e) {
          opts.report.reportInfo(
            MessageName.UNNAMED,
            `Couldn't mutate bindings for ${structUtils.stringifyLocator(pkg)}`,
          )

          console.error(e)
        }
        break
      }
    }
  }
}

export async function afterAllInstalled(project: Project, opts: InstallOptions) {
  await opts.report.startTimerPromise(`Native dependency step`, async () => {
    // In the config file all native modules must already be unplugged

    // Find all bindings dependencies
    await findBindingsDependencies(project, opts)
  })
}
