import { AliasFS, CwdFS, Filename, LazyFS, NodeFS, PortablePath, ppath, xfs } from '@yarnpkg/fslib'
import { FetchOptions, Fetcher, Locator, MinimalFetchOptions, miscUtils, structUtils } from '@yarnpkg/core'
import {DEFAULT_COMPRESSION_LEVEL, ZipFS}                        from '@yarnpkg/libzip';

import { getLibzipPromise } from '@yarnpkg/libzip'

export class PrebuildFetcher implements Fetcher {
  supports(locator: Locator, opts: MinimalFetchOptions) {
    if (!locator.reference.startsWith(`prebuild:`)) return false

    return true
  }

  getLocalPath(locator: Locator, opts: FetchOptions) {
    return null
  }

  async fetch(locator: Locator, opts: FetchOptions) {
    const baseFs = new NodeFS()

    const { zipPackage } = await this.fetchPrebuild(locator, opts)
    const originalPath = zipPackage.getRealPath()

    await xfs.chmodPromise(originalPath, 0o644)

    // This file will be overwritten later, it's cache key just needs to be constant per locator
    const checksum = `${opts.cache.cacheKey}/${locator.locatorHash}`

    const cachePath = opts.cache.getLocatorPath(locator, checksum)

    // Add the cache path to the marked files list so that the zips aren't removed
    opts.cache.markedFiles.add(cachePath)

    if (!cachePath) throw new Error(`Assertion failed: Expected the cache path to be available`)

    await xfs.mkdirpPromise(ppath.dirname(cachePath))
    await xfs.movePromise(originalPath, cachePath)

    let zipFs: ZipFS | undefined;

    const zipFsBuilder = () => new ZipFS(cachePath, {baseFs, readOnly: true});

    const lazyFs = new LazyFS<PortablePath>(() => miscUtils.prettifySyncErrors(() => {
      return zipFs = zipFsBuilder();
    }, message => {
      return `Failed to open the cache entry for ${structUtils.prettyLocator(opts.project.configuration, locator)}: ${message}`;
    }), ppath);

    // We use an AliasFS to speed up getRealPath calls (e.g. VirtualFetcher.ensureVirtualLink)
    // (there's no need to create the lazy baseFs instance to gather the already-known cachePath)
    const aliasFs = new AliasFS(cachePath, {baseFs: lazyFs, pathUtils: ppath});

    const releaseFs = () => {
      zipFs?.discardAndClose();
    };

    return {
      packageFs: aliasFs,
      releaseFs,
      prefixPath: structUtils.getIdentVendorPath(locator),
      localPath: this.getLocalPath(locator, opts),
      checksum,
    }
  }

  private async fetchPrebuild(locator: Locator, opts: FetchOptions) {
    const tmpDir = await xfs.mktempPromise()
    const tmpFile = ppath.join(tmpDir, `prebuilt.zip` as Filename)
    const prefixPath = structUtils.getIdentVendorPath(locator)

    const zipPackage = new ZipFS(tmpFile, { create: true })
    await zipPackage.mkdirpPromise(prefixPath)

    const generatedPackage = new CwdFS(prefixPath, { baseFs: zipPackage })

    // Write our package.json
    await generatedPackage.writeJsonPromise(`package.json` as Filename, {
      name: structUtils.slugifyLocator(locator),
      main: `./index.js`,
      preferUnplugged: true, // Tell yarn to unplug the bindings package
    })

    // write our index.js
    const templateIndex = `// This will be replaced at the end of the build step
    // locatorHash: ${locator.locatorHash}
    `
    await generatedPackage.writeFilePromise(`index.js` as Filename, templateIndex)

    zipPackage.saveAndClose()

    return {
      zipPackage,
    }
  }
}
