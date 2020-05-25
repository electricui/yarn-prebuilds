# `@yarnpkg/plugin-prebuilds`

For Yarn v2.

To install, import from the repository.

```
yarn plugin import https://raw.githubusercontent.com/electricui/yarn-prebuilds/master/bundles/%40yarnpkg/plugin-prebuilds.js
```

The [bindings](https://github.com/TooTallNate/node-bindings) package creates a runtime error in order to reflect its caller's filepath, which is used to search the filesystem for the correct `.node` native binding.

This plugin intercepts packages with dependencies to `bindings` and automatically grabs the prebuild for that version. If `electron` is in your dependencies list, the runtime is set to `electron`.

It rewrites the `bindings` dependency for each package to statically refer to the `.node` binding, removing all runtime searching.

Node-abi is bundled into this plugin, so it will need to be updated each time Electron releases a new ABI version.

Once the dependency is referred to statically, a [Webpack plugin](https://github.com/toyobayashi/native-addon-loader) or [Rollup plugin](https://github.com/danielgindi/rollup-plugin-natives) can be used to consume and load the `.node` file like any other asset.

For example, we use webpack-dev-server and have a loader that provides an absolute path during development. During bundling, we copy the `.node` file to a relative path and package it with the bundle.

## All Configuration

Configuration can be set in your .yarncr.yml file.

```yml
prebuildScopes:
  "@serialport":
    prebuildTagPrefix: "@serialport/bindings@"
    prebuildHostMirrorUrl: 'https://custom-prebuild-mirror.com/prebuilds'
    prebuildHostMirrorTemplate: '{mirror_url}/{scopeWithAtAndSlash}{name}-v{version}-{runtime}-v{abi}-{platform}{libc}-{arch}.tar.gz'
prebuildHostMirrorUrl: 'https://other-custom-prebuild-mirror.com/prebuilds'
prebuildHostMirrorTemplate: '{mirror_url}/{version}/{scopeWithAtAndSlash}{name}-v{version}-{runtime}-v{abi}-{platform}{libc}-{arch}.tar.gz'
```

## Custom Mirrors

The `prebuildHostMirrorUrl` config can be used to set a custom prebuild mirror URL.

```yml
prebuildHostMirrorUrl: 'https://custom-prebuild-mirror.com/prebuilds'
```

The `prebuildHostMirrorTemplate` config key can be used to set a custom template to fetch the prebuild tar.

The template variables injected are as follows:

```
{mirror_url}
{name}
{version}
{abi}
{runtime}
{platform}
{arch}
{libc}
{tag_prefix}
{scope}
{scopeWithAt}
{scopeWithAtAndSlash}
{scopeWithSlash}
```

For example

```yml
prebuildHostMirrorTemplate: '{mirror_url}/{scopeWithAtAndSlash}{name}-v{version}-{runtime}-v{abi}-{platform}{libc}-{arch}.tar.gz'
```

The default template is:

```
{mirror_url}/{tag_prefix}{version}/{name}-v{version}-{runtime}-v{abi}-{platform}{libc}-{arch}.tar.gz
```

## Scoped configuration

Configuration can be done per scope with the `prebuildScopes` config key.

```yml
prebuildScopes:
  "@serialport":
    prebuildTagPrefix: "@serialport/bindings@"
```

