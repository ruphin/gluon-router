# Changelog

All notable changes to Gluon Router are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0] - 2026-10-09

### Added

- Type declarations: the project is written in TypeScript and the package ships `.d.ts` files for the public API, including the `RouteChangeCallback` and `InterceptLinksOptions` types.
- `CHANGELOG.md`.

### Changed

- The package entry point is the built ES module `dist/index.js`, resolved through the `exports` field. Import `@gluon/router` instead of `@gluon/router/gluon-router.js`.
- The build is ESM only and targets current browsers. Vite emits one file per source module into `dist/`.
- Tooling follows the standard frontend structure: Vite library build, Vitest with happy-dom, Prettier, `tsc` type checking, and a `dev/` page served with `npm run dev`. Releases are published with `npm publish`, which runs the checks and the build first.

### Removed

- Support for Internet Explorer 11 and legacy Edge, along with the `Event` constructor and `composedPath()` polyfills and the `URL` fallback that served them.
- The UMD bundle `gluon-router.umd.js` and the ES5 bundle `gluon-router.es5.js`. The `GluonRouter` global is gone; use a module script.
- The `np` release tool and the Travis CI configuration.
