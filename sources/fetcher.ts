import {Fetcher, structUtils, FetchOptions, MinimalFetchOptions, miscUtils, FetchResult, ReportError, MessageName, Locator, hashUtils} from '@yarnpkg/core';
import {ppath, xfs, ZipFS, Filename, CwdFS, PortablePath, LazyFS, NodeFS}                                                              from '@yarnpkg/fslib';
import {getLibzipPromise}                                                                                                              from '@yarnpkg/libzip';

import * as utils                                                                                                                      from './utils';


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
    const baseFs = new NodeFS();

    const zipFs = await this.fetchPrebuild(locator, opts);
    const originalPath = zipFs.getRealPath();

    zipFs.saveAndClose();

    await xfs.chmodPromise(originalPath, 0o644);

    // Do this before moving the file so that we don't pollute the cache with corrupted archives
    const checksum = `${opts.cache.cacheKey}/${await hashUtils.checksumFile(originalPath)}`;

    const cachePath = opts.cache.getLocatorPath(locator, checksum);

    if (!cachePath)
      throw new Error(`Assertion failed: Expected the cache path to be available`);

    await xfs.movePromise(originalPath, cachePath);
    await xfs.mkdirpPromise(ppath.dirname(cachePath));

    let readOnlyZipFs: ZipFS | null = null;

    const libzip = await getLibzipPromise();
    const lazyFs: LazyFS<PortablePath> = new LazyFS<PortablePath>(() => miscUtils.prettifySyncErrors(() => {
      return readOnlyZipFs = new ZipFS(cachePath, {baseFs, libzip, readOnly: true});
    }, message => {
      return `Failed to open the cache entry for ${structUtils.prettyLocator(opts.project.configuration, locator)}: ${message}`;
    }), ppath);

    const releaseFs = () => {
      if (readOnlyZipFs !== null) {
        readOnlyZipFs.discardAndClose();
      }
    };

    return {
      packageFs: lazyFs,
      releaseFs,
      prefixPath: structUtils.getIdentVendorPath(locator),
      localPath: this.getLocalPath(locator, opts),
      checksum,
    };
  }

  private async fetchPrebuild(locator: Locator, opts: FetchOptions) {
    const {packageIdent} = utils.parseSpec(locator.reference);

    // opts.report.reportInfo(MessageName.UNNAMED, `Fetching prebuild for ${structUtils.stringifyIdent(locator)}`);

    const electronVersion = await utils.getElectronVersion(opts.project);
    const nativeModule = await utils.getNativeModule(opts.project, packageIdent, locator);

    if (nativeModule === null)
      throw new ReportError(MessageName.UNNAMED, `Could not find the native module that had a prebuild attempt`);


    if (nativeModule.version === null)
      throw new ReportError(MessageName.UNNAMED, `Could not find the native module version that had a prebuild attempt`);


    const prebuildOptions: utils.PrebuildCalculatedOptions = {
      abi: electronVersion ? utils.getElectronABI(electronVersion) : process.versions.modules,
      runtime: electronVersion ? `electron` : `node`,
    };

    const prebuildUrl = await utils.getUrlOfPrebuild(nativeModule, opts, prebuildOptions);

    let prebuildPackage: FetchResult;
    try {
      prebuildPackage = await opts.fetcher.fetch(
        structUtils.makeLocator(
          structUtils.makeIdent(
            `prebuilds`,
            `${structUtils.slugifyIdent(nativeModule)}-v${
              nativeModule.version
            }-${
              process.platform
            }-${
              process.arch
            }-${
              prebuildOptions.runtime
            }-${
              prebuildOptions.abi
            }`), prebuildUrl), opts);
    } catch (e) {
      opts.report.reportInfo(MessageName.UNNAMED, `Error fetching ${prebuildUrl}`);
      throw e;
    }

    // opts.report.reportInfo(MessageName.UNNAMED, `Fetched prebuild for ${structUtils.stringifyIdent(nativeModule)} version ${nativeModule.version} on runtime electron version ${electronVersion}`);

    const cancellationSignal = {cancel: false};
    let nodeContents: Buffer | null = null;
    let bindingsLocation = ``;

    // Walk the downloaded prebuild directory, find the file
    await miscUtils.releaseAfterUseAsync(async () => {
      await utils.walk(prebuildPackage.packageFs, `.` as PortablePath, async (filesystem, filepath) => {
        nodeContents = await filesystem.readFilePromise(filepath);
        bindingsLocation = filepath;

        // send the break signal
        cancellationSignal.cancel = true;
      }, cancellationSignal);
    }, prebuildPackage.releaseFs);

    if (nodeContents === null)
      throw new ReportError(MessageName.UNNAMED, `Was unable to find node file in prebuild package for "${structUtils.stringifyIdent(nativeModule)}"`);

    const tmpDir = await xfs.mktempPromise();
    const tmpFile = ppath.join(tmpDir, `prebuilt.zip` as Filename);
    const prefixPath = structUtils.getIdentVendorPath(locator);

    const libzip = await getLibzipPromise();

    const zipPackage = new ZipFS(tmpFile, {libzip, create: true});
    await zipPackage.mkdirpPromise(prefixPath);

    const generatedPackage = new CwdFS(prefixPath, {baseFs: zipPackage});

    // Write our package.json
    await generatedPackage.writeJsonPromise(`package.json` as Filename, {
      name: structUtils.slugifyLocator(locator),
      main: `./index.js`,
    });

    // write our index.js
    const templateIndex = `// Automatically generated bindings file
// Bindings taken from ${bindingsLocation}

const staticRequire = require("./bindings.node");
module.exports = (fileLookingFor) => {
  return staticRequire;
};
    `;
    await generatedPackage.writeFilePromise(`index.js` as Filename, templateIndex);

    // Write the file into the generated package
    await generatedPackage.writeFilePromise(`bindings.node` as Filename, nodeContents);


    return zipPackage;
  }
}
