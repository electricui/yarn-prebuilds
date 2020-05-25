/* eslint-disable */
module.exports = {
name: "@yarnpkg/plugin-prebuilds",
factory: function (require) {
var plugin =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

const core_1 = __webpack_require__(1);

const add_prebuilt_dependencies_1 = __webpack_require__(2);

const fetcher_1 = __webpack_require__(3);

const resolver_1 = __webpack_require__(10);

const prebuildSettings = {
  prebuildRuntime: {
    description: `The runtime used, either 'electron' or 'node'`,
    type: core_1.SettingsType.STRING,
    default: null
  },
  prebuildAbi: {
    description: `The ABI of the runtime used.`,
    type: core_1.SettingsType.STRING,
    default: null
  },
  prebuildTagPrefix: {
    description: `The prebuild tag prefix`,
    type: core_1.SettingsType.STRING,
    default: `v`
  },
  prebuildHostMirrorUrl: {
    description: `The prebuild host mirror URL`,
    type: core_1.SettingsType.STRING,
    default: null
  },
  prebuildHostMirrorTemplate: {
    description: `The prebuild host mirror template`,
    type: core_1.SettingsType.STRING,
    default: `{mirror_url}/{tag_prefix}{version}/{name}-v{version}-{runtime}-v{abi}-{platform}{libc}-{arch}.tar.gz`
  }
};
const plugin = {
  hooks: {
    reduceDependency: add_prebuilt_dependencies_1.reduceDependency
  },
  fetchers: [fetcher_1.PrebuildFetcher],
  resolvers: [resolver_1.PrebuildResolver],
  configuration: Object.assign(Object.assign({}, prebuildSettings), {
    prebuildScopes: {
      description: `Prebuild settings per package scope`,
      type: core_1.SettingsType.MAP,
      valueDefinition: {
        description: ``,
        type: core_1.SettingsType.SHAPE,
        properties: Object.assign({}, prebuildSettings)
      }
    }
  })
}; // eslint-disable-next-line arca/no-default-export

exports.default = plugin;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("@yarnpkg/core");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reduceDependency = void 0;

const core_1 = __webpack_require__(1);

exports.reduceDependency = async (dependency, project, locator) => {
  if (dependency.name === `bindings` && dependency.scope === null) {
    // extra.resolveOptions.report.reportInfo(MessageName.UNNAMED, `Found a bindings dependency in ${structUtils.stringifyIdent(locator)}, re-routing to prebuild.`);
    const selector = `builtin<prebuild/${core_1.structUtils.stringifyIdent(locator)}>`; // TODO: Add process.platform and arch to this

    return core_1.structUtils.makeDescriptor(dependency, core_1.structUtils.makeRange({
      protocol: `prebuild:`,
      source: `bindings<${core_1.structUtils.slugifyIdent(locator)}>${process.platform}-${process.arch}`,
      selector,
      params: null
    }));
  }

  return dependency;
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, {
    enumerable: true,
    get: function () {
      return m[k];
    }
  });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});

var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);

  __setModuleDefault(result, mod);

  return result;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PrebuildFetcher = void 0;

const core_1 = __webpack_require__(1);

const fslib_1 = __webpack_require__(4);

const libzip_1 = __webpack_require__(5);

const utils = __importStar(__webpack_require__(6));

class PrebuildFetcher {
  supports(locator, opts) {
    if (!locator.reference.startsWith(`prebuild:`)) return false;
    return true;
  }

  getLocalPath(locator, opts) {
    return null;
  }

  async fetch(locator, opts) {
    const baseFs = new fslib_1.NodeFS();
    const zipFs = await this.fetchPrebuild(locator, opts);
    const originalPath = zipFs.getRealPath();
    zipFs.saveAndClose();
    await fslib_1.xfs.chmodPromise(originalPath, 0o644); // Do this before moving the file so that we don't pollute the cache with corrupted archives

    const checksum = `${opts.cache.cacheKey}/${await core_1.hashUtils.checksumFile(originalPath)}`;
    const cachePath = opts.cache.getLocatorPath(locator, checksum);
    if (!cachePath) throw new Error(`Assertion failed: Expected the cache path to be available`);
    await fslib_1.xfs.movePromise(originalPath, cachePath);
    await fslib_1.xfs.mkdirpPromise(fslib_1.ppath.dirname(cachePath));
    let readOnlyZipFs = null;
    const libzip = await libzip_1.getLibzipPromise();
    const lazyFs = new fslib_1.LazyFS(() => core_1.miscUtils.prettifySyncErrors(() => {
      return readOnlyZipFs = new fslib_1.ZipFS(cachePath, {
        baseFs,
        libzip,
        readOnly: true
      });
    }, message => {
      return `Failed to open the cache entry for ${core_1.structUtils.prettyLocator(opts.project.configuration, locator)}: ${message}`;
    }), fslib_1.ppath);

    const releaseFs = () => {
      if (readOnlyZipFs !== null) {
        readOnlyZipFs.discardAndClose();
      }
    };

    return {
      packageFs: lazyFs,
      releaseFs,
      prefixPath: core_1.structUtils.getIdentVendorPath(locator),
      localPath: this.getLocalPath(locator, opts),
      checksum
    };
  }

  async fetchPrebuild(locator, opts) {
    const {
      packageIdent
    } = utils.parseSpec(locator.reference); // opts.report.reportInfo(MessageName.UNNAMED, `Fetching prebuild for ${structUtils.stringifyIdent(locator)}`);

    const electronVersion = await utils.getElectronVersion(opts.project);
    const nativeModule = await utils.getNativeModule(opts.project, packageIdent, locator);
    if (nativeModule === null) throw new core_1.ReportError(core_1.MessageName.UNNAMED, `Could not find the native module that had a prebuild attempt`);
    if (nativeModule.version === null) throw new core_1.ReportError(core_1.MessageName.UNNAMED, `Could not find the native module version that had a prebuild attempt`);
    const prebuildOptions = {
      abi: electronVersion ? utils.getElectronABI(electronVersion) : process.versions.modules,
      runtime: electronVersion ? `electron` : `node`
    };
    const prebuildUrl = await utils.getUrlOfPrebuild(nativeModule, opts, prebuildOptions);
    let prebuildPackage;

    try {
      prebuildPackage = await opts.fetcher.fetch(core_1.structUtils.makeLocator(core_1.structUtils.makeIdent(`prebuilds`, `${core_1.structUtils.slugifyIdent(nativeModule)}-v${nativeModule.version}-${process.platform}-${process.arch}-${prebuildOptions.runtime}-${prebuildOptions.abi}`), prebuildUrl), opts);
    } catch (e) {
      opts.report.reportInfo(core_1.MessageName.UNNAMED, `Error fetching ${prebuildUrl}`);
      throw e;
    } // opts.report.reportInfo(MessageName.UNNAMED, `Fetched prebuild for ${structUtils.stringifyIdent(nativeModule)} version ${nativeModule.version} on runtime electron version ${electronVersion}`);


    const cancellationSignal = {
      cancel: false
    };
    let nodeContents = null;
    let bindingsLocation = ``; // Walk the downloaded prebuild directory, find the file

    await core_1.miscUtils.releaseAfterUseAsync(async () => {
      await utils.walk(prebuildPackage.packageFs, `.`, async (filesystem, filepath) => {
        nodeContents = await filesystem.readFilePromise(filepath);
        bindingsLocation = filepath; // send the break signal

        cancellationSignal.cancel = true;
      }, cancellationSignal);
    }, prebuildPackage.releaseFs);
    if (nodeContents === null) throw new core_1.ReportError(core_1.MessageName.UNNAMED, `Was unable to find node file in prebuild package for "${core_1.structUtils.stringifyIdent(nativeModule)}"`);
    const tmpDir = await fslib_1.xfs.mktempPromise();
    const tmpFile = fslib_1.ppath.join(tmpDir, `prebuilt.zip`);
    const prefixPath = core_1.structUtils.getIdentVendorPath(locator);
    const libzip = await libzip_1.getLibzipPromise();
    const zipPackage = new fslib_1.ZipFS(tmpFile, {
      libzip,
      create: true
    });
    await zipPackage.mkdirpPromise(prefixPath);
    const generatedPackage = new fslib_1.CwdFS(prefixPath, {
      baseFs: zipPackage
    }); // Write our package.json

    await generatedPackage.writeJsonPromise(`package.json`, {
      name: core_1.structUtils.slugifyLocator(locator),
      main: `./index.js`
    }); // write our index.js

    const templateIndex = `// Automatically generated bindings file
// Bindings taken from ${bindingsLocation}

const staticRequire = require("./bindings.node");
module.exports = (fileLookingFor) => {
  return staticRequire;
};
    `;
    await generatedPackage.writeFilePromise(`index.js`, templateIndex); // Write the file into the generated package

    await generatedPackage.writeFilePromise(`bindings.node`, nodeContents);
    return zipPackage;
  }

}

exports.PrebuildFetcher = PrebuildFetcher;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("@yarnpkg/fslib");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("@yarnpkg/libzip");

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.walk = exports.getUrlOfPrebuild = exports.getElectronABI = exports.gitRepositoryToGithubLink = exports.getPrebuildConfiguration = exports.parseSpec = exports.getNativeModule = exports.getElectronVersion = void 0;

const core_1 = __webpack_require__(1);

const fslib_1 = __webpack_require__(4);

const plugin_npm_1 = __webpack_require__(7);

const node_abi_1 = __webpack_require__(8);

exports.getElectronVersion = async project => {
  for (const pkg of project.storedPackages.values()) {
    if (pkg.name === `electron`) {
      return pkg.version;
    }
  }

  return null;
};

exports.getNativeModule = async (project, packageIdent, ident) => {
  // we need to find the package that matches packageIdent which has a dependency on our ephemeral bindings package
  for (const pkg of project.storedPackages.values()) {
    // see if it matches packageIdent
    if (pkg.name === packageIdent.name && pkg.scope === packageIdent.scope) {
      //for (const [identHash, dependency] of pkg.dependencies) {
      //  if (dependency.name === "bindings") {
      return pkg; //  }
      //}
    }
  }

  return null;
};

function parseSpec(spec) {
  const payload = spec.substring(spec.indexOf(`builtin<prebuild/`) + 17, spec.length - 1);
  const packageIdent = core_1.structUtils.parseIdent(payload);
  return {
    packageIdent
  };
}

exports.parseSpec = parseSpec;

function getPrebuildConfiguration(scope, configuration) {
  const prebuildScopedConfigurations = configuration.get(`prebuildScopes`);
  const exactEntry = prebuildScopedConfigurations.get(scope);
  if (typeof exactEntry !== `undefined`) return exactEntry;
  return null;
}

exports.getPrebuildConfiguration = getPrebuildConfiguration;

function gitRepositoryToGithubLink(repository) {
  var m = /github\.com\/([^\/]+)\/([^\/\.]+)\.git/.exec(repository);
  if (m) return `https://github.com/${m[1]}/${m[2]}`;
  return null;
}

exports.gitRepositoryToGithubLink = gitRepositoryToGithubLink;

function getConfigEntry(nativeModule, entry, opts) {
  const configuration = opts.project.configuration;
  const scopeWithAt = `@${nativeModule.scope}`;
  const scopedConfiguration = nativeModule.scope ? getPrebuildConfiguration(scopeWithAt, configuration) : null;
  const effectiveConfiguration = scopedConfiguration || configuration;
  if (effectiveConfiguration.get(entry)) return effectiveConfiguration.get(entry);
  return configuration.get(entry);
}

function getElectronABI(electronVersion) {
  return node_abi_1.getAbi(electronVersion, `electron`);
}

exports.getElectronABI = getElectronABI;

function runTemplate(template, templateValues) {
  for (const [key, value] of Object.entries(templateValues)) template = template.replace(new RegExp(`{${key}}`, `g`), value);

  return template;
}

async function getGithubLink(nativeModule, opts) {
  var _a;

  const registryData = await plugin_npm_1.npmHttpUtils.get(plugin_npm_1.npmHttpUtils.getIdentUrl(nativeModule), {
    configuration: opts.project.configuration,
    ident: nativeModule,
    json: true
  });
  if (!Object.prototype.hasOwnProperty.call(registryData, `versions`)) throw new core_1.ReportError(core_1.MessageName.REMOTE_INVALID, `Registry returned invalid data for - missing "versions" field`);
  if (!Object.prototype.hasOwnProperty.call(registryData.versions, nativeModule.version)) throw new core_1.ReportError(core_1.MessageName.REMOTE_NOT_FOUND, `Registry failed to return reference "${nativeModule.version}"`);
  const data = registryData.versions[nativeModule.version];
  const repository = (_a = data.repository) === null || _a === void 0 ? void 0 : _a.url;
  if (!repository) throw new core_1.ReportError(core_1.MessageName.UNNAMED, `Unable to find repository information for "${core_1.structUtils.stringifyIdent(nativeModule)}"`);
  const githubUrl = gitRepositoryToGithubLink(repository);
  if (!githubUrl) throw new core_1.ReportError(core_1.MessageName.UNNAMED, `Unable to find GitHub URL for "${core_1.structUtils.stringifyIdent(nativeModule)}"`);
  return githubUrl;
}

async function getUrlOfPrebuild(nativeModule, opts, prebuildOpts) {
  const convertedName = core_1.structUtils.stringifyIdent(nativeModule).replace(/^@\w+\//, ``);
  const name = convertedName;
  const version = nativeModule.version;
  const abi = prebuildOpts.abi;
  const runtime = prebuildOpts.runtime;
  const platform = process.platform;
  const arch = process.arch;
  const libc = process.env.LIBC || ``; // eslint-disable-next-line @typescript-eslint/camelcase

  const tag_prefix = getConfigEntry(nativeModule, `prebuildTagPrefix`, opts);
  const packageName = `${name}-v${version}-${runtime}-v${abi}-${platform}${libc}-${arch}.tar.gz`; // eslint-disable-next-line @typescript-eslint/camelcase

  const mirror_url = getConfigEntry(nativeModule, `prebuildHostMirrorUrl`, opts); // eslint-disable-next-line @typescript-eslint/camelcase

  if (mirror_url) {
    const template = getConfigEntry(nativeModule, `prebuildHostMirrorTemplate`, opts);
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
      scopeWithSlash: nativeModule.scope ? `${nativeModule.scope}/` : ``
    });
  }

  const githubLink = await getGithubLink(nativeModule, opts); // eslint-disable-next-line @typescript-eslint/camelcase

  return `${githubLink}/releases/download/${tag_prefix}${version}/${packageName}`;
}

exports.getUrlOfPrebuild = getUrlOfPrebuild;

exports.walk = async (filesystem, currentPath, callback, cancellationSignal) => {
  if (cancellationSignal.cancel) return;
  const files = await filesystem.readdirPromise(currentPath);
  await Promise.all(files.map(async filename => {
    if (cancellationSignal.cancel) return;
    const filepath = fslib_1.ppath.join(currentPath, filename);
    const stat = await filesystem.statPromise(filepath);

    if (stat.isDirectory()) {
      await exports.walk(filesystem, filepath, callback, cancellationSignal);
    } else if (stat.isFile()) {
      await callback(filesystem, filepath);
    }
  }));
};

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("@yarnpkg/plugin-npm");

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var semver = __webpack_require__(9)

function getNextTarget (runtime, targets) {
  if (targets == null) targets = allTargets
  var latest = targets.filter(function (t) { return t.runtime === runtime }).slice(-1)[0]
  var increment = runtime === 'electron' ? 'minor' : 'major'
  return semver.inc(latest.target, increment)
}

function getAbi (target, runtime) {
  if (target === String(Number(target))) return target
  if (target) target = target.replace(/^v/, '')
  if (!runtime) runtime = 'node'

  if (runtime === 'node') {
    if (!target) return process.versions.modules
    if (target === process.versions.node) return process.versions.modules
  }

  var abi

  for (var i = 0; i < allTargets.length; i++) {
    var t = allTargets[i]
    if (t.runtime !== runtime) continue
    if (semver.lte(t.target, target)) abi = t.abi
    else break
  }

  if (abi && semver.lt(target, getNextTarget(runtime))) return abi
  throw new Error('Could not detect abi for version ' + target + ' and runtime ' + runtime + '.  Updating "node-abi" might help solve this issue if it is a new release of ' + runtime)
}

function getTarget (abi, runtime) {
  if (abi && abi !== String(Number(abi))) return abi
  if (!runtime) runtime = 'node'

  if (runtime === 'node' && !abi) return process.versions.node

  var match = allTargets
    .filter(function (t) {
      return t.abi === abi && t.runtime === runtime
    })
    .map(function (t) {
      return t.target
    })
  if (match.length) return match[0]

  throw new Error('Could not detect target for abi ' + abi + ' and runtime ' + runtime)
}

var supportedTargets = [
  {runtime: 'node', target: '5.0.0', abi: '47', lts: false},
  {runtime: 'node', target: '6.0.0', abi: '48', lts: false},
  {runtime: 'node', target: '7.0.0', abi: '51', lts: false},
  {runtime: 'node', target: '8.0.0', abi: '57', lts: false},
  {runtime: 'node', target: '9.0.0', abi: '59', lts: false},
  {runtime: 'node', target: '10.0.0', abi: '64', lts: new Date(2018, 10, 1) < new Date() && new Date() < new Date(2020, 4, 31)},
  {runtime: 'node', target: '11.0.0', abi: '67', lts: false},
  {runtime: 'node', target: '12.0.0', abi: '72', lts: new Date(2019, 9, 21) < new Date() && new Date() < new Date(2020, 9, 31)},
  {runtime: 'node', target: '13.0.0', abi: '79', lts: false},
  {runtime: 'node', target: '14.0.0', abi: '83', lts: false},
  {runtime: 'electron', target: '0.36.0', abi: '47', lts: false},
  {runtime: 'electron', target: '1.1.0', abi: '48', lts: false},
  {runtime: 'electron', target: '1.3.0', abi: '49', lts: false},
  {runtime: 'electron', target: '1.4.0', abi: '50', lts: false},
  {runtime: 'electron', target: '1.5.0', abi: '51', lts: false},
  {runtime: 'electron', target: '1.6.0', abi: '53', lts: false},
  {runtime: 'electron', target: '1.7.0', abi: '54', lts: false},
  {runtime: 'electron', target: '1.8.0', abi: '57', lts: false},
  {runtime: 'electron', target: '2.0.0', abi: '57', lts: false},
  {runtime: 'electron', target: '3.0.0', abi: '64', lts: false},
  {runtime: 'electron', target: '4.0.0', abi: '64', lts: false},
  {runtime: 'electron', target: '4.0.4', abi: '69', lts: false},
  {runtime: 'electron', target: '5.0.0', abi: '70', lts: false},
  {runtime: 'electron', target: '6.0.0', abi: '73', lts: false},
  {runtime: 'electron', target: '7.0.0', abi: '75', lts: false},
  {runtime: 'electron', target: '8.0.0', abi: '76', lts: false},
  {runtime: 'electron', target: '9.0.0', abi: '80', lts: false}
]

var additionalTargets = [
  {runtime: 'node-webkit', target: '0.13.0', abi: '47', lts: false},
  {runtime: 'node-webkit', target: '0.15.0', abi: '48', lts: false},
  {runtime: 'node-webkit', target: '0.18.3', abi: '51', lts: false},
  {runtime: 'node-webkit', target: '0.23.0', abi: '57', lts: false},
  {runtime: 'node-webkit', target: '0.26.5', abi: '59', lts: false}
]

var deprecatedTargets = [
  {runtime: 'node', target: '0.2.0', abi: '1', lts: false},
  {runtime: 'node', target: '0.9.1', abi: '0x000A', lts: false},
  {runtime: 'node', target: '0.9.9', abi: '0x000B', lts: false},
  {runtime: 'node', target: '0.10.4', abi: '11', lts: false},
  {runtime: 'node', target: '0.11.0', abi: '0x000C', lts: false},
  {runtime: 'node', target: '0.11.8', abi: '13', lts: false},
  {runtime: 'node', target: '0.11.11', abi: '14', lts: false},
  {runtime: 'node', target: '1.0.0', abi: '42', lts: false},
  {runtime: 'node', target: '1.1.0', abi: '43', lts: false},
  {runtime: 'node', target: '2.0.0', abi: '44', lts: false},
  {runtime: 'node', target: '3.0.0', abi: '45', lts: false},
  {runtime: 'node', target: '4.0.0', abi: '46', lts: false},
  {runtime: 'electron', target: '0.30.0', abi: '44', lts: false},
  {runtime: 'electron', target: '0.31.0', abi: '45', lts: false},
  {runtime: 'electron', target: '0.33.0', abi: '46', lts: false}
]

var futureTargets = []

var allTargets = deprecatedTargets
  .concat(supportedTargets)
  .concat(additionalTargets)
  .concat(futureTargets)

exports.getAbi = getAbi
exports.getTarget = getTarget
exports.deprecatedTargets = deprecatedTargets
exports.supportedTargets = supportedTargets
exports.additionalTargets = additionalTargets
exports.futureTargets = futureTargets
exports.allTargets = allTargets
exports._getNextTarget = getNextTarget


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("semver");

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PrebuildResolver = void 0;

const core_1 = __webpack_require__(1);

class PrebuildResolver {
  supportsDescriptor(descriptor, opts) {
    if (!descriptor.range.startsWith(`prebuild:`)) return false;
    return true;
  }

  supportsLocator(locator, opts) {
    if (!locator.reference.startsWith(`prebuild:`)) return false;
    return true;
  }

  shouldPersistResolution(locator, opts) {
    return false;
  }

  bindDescriptor(descriptor, fromLocator, opts) {
    return descriptor;
  }

  getResolutionDependencies(descriptor, opts) {
    return [];
  }

  async getCandidates(descriptor, dependencies, opts) {
    if (!opts.fetchOptions) throw new Error(`Assertion failed: This resolver cannot be used unless a fetcher is configured`);
    return [core_1.structUtils.makeLocator(core_1.structUtils.parseIdent(`bindings`), descriptor.range)];
  }

  async resolve(locator, opts) {
    // We have to defer all the actual resolution until the rest of the tree is figured out
    // We'll figure out our actual node files in the fetch step once everything else is resolved.
    return Object.assign(Object.assign({}, locator), {
      version: `*`,
      languageName: opts.project.configuration.get(`defaultLanguageName`),
      linkType: core_1.LinkType.HARD,
      dependencies: new Map(),
      peerDependencies: new Map(),
      dependenciesMeta: new Map(),
      peerDependenciesMeta: new Map(),
      bin: new Map()
    });
  }

}

exports.PrebuildResolver = PrebuildResolver;

/***/ })
/******/ ]);
return plugin;
}
};