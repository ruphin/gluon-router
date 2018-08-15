# Gluon Router

[![Build Status](https://api.travis-ci.org/ruphin/gluon-router.svg?branch=master)](https://travis-ci.org/ruphin/gluon-router)
[![NPM Latest version](https://img.shields.io/npm/v/@gluon/router.svg)](https://www.npmjs.com/package/@gluon/router)
[![Code Style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

An unopinionated javascript router. If enabled, it intercepts browser navigation to same-origin locations, and exposes a hook to attach callbacks for navigation events. This module implements the bare fundamentals required for frontend navigation, and is not intended to replace a full-featured router.

Includes a miniature polyfill for `Event()` and `Event.prototype.composedPath()` for IE11 and Edge.

## Compatibility

| Chrome | Safari | Edge | Firefox | IE  |
| ------ | ------ | ---- | ------- | --- |
| ✔      | ✔      | ✔\*  | ✔       | ✔\* |

\* Will activate some polyfills when link interception is enabled.

## Installation

GluonRouter is available through [npm](https://www.npmjs.com/package/@gluon/router) as `@gluon/router`.

## Example Usage

```javascript
import { interceptLinks, onRouteChange } from '/node_modules/@gluon/router/gluon-router.js';

interceptLinks({
  include: [/^\/my\//, /^\/application\//, /^\/paths\//],
  exclude: [/^\/paths\/that\/should\/reload\//]
});

onRouteChange((path, query, hash) => {
  // Implement page navigation here
});
```

## API

### onRouteChange

Registers a callback that will be called whenever any browser navigation happens.
The callback is called with the path, query, and hash components of the new location.

You can register as many callbacks as you want.

```javascript
import { onRouteChange } from '/node_modules/@gluon/router/gluon-router.js';

onRouteChange((path, query, hash) => {
  console.log('PATH: ', path);
  console.log('QUERY: ', query);
  console.log('HASH: ', hash);
});
```

### interceptLinks

Enables link interception. After calling this, the browser will no longer reload when the user clicks on a same-domain link. Instead, the new url will be added to the browser navigation history, and any `onRouteChange` callbacks are called.

This function has has an optional parameter with two options:

    {
      include: <Array> of <RegExp> to paths that should be intercepted
      exclude: <Array> of <RegExp> to paths that should not be intercepted
    }

This function may be called multiple times. Each call beyond the first adds the provided `included` and `excluded` expressions to the system.

Note: If the `include` parameter is not defined, all same-domain paths will be intercepted. Pass an empty array `[]` to avoid enabling interception on all same-domain paths.

```javascript
import { interceptLinks } from '/node_modules/@gluon/router/gluon-router.js';

// Intercept any links to paths that begin with '/my/', '/application/', or '/paths/'
// But NOT links to paths that begin with '/paths/that/should/reload/'
interceptLinks({
  include: [/^\/my\//, /^\/application\//, /^\/paths\//],
  exclude: [/^\/paths\/that\/should\/reload\//]
});
```

### changeRoute

Updates the browser location and triggers the `onRouteChange` event handler. This can be used to trigger `onRouteChange` event handlers from javascript.

```javascript
import { changeRoute } from '/node_modules/@gluon/router/gluon-router.js';

// If the current url is https://example.com/path?query=value#hash
changeRoute('/new_path?query=new_value#new_hash');

window.location === 'https://example.com/new_path?query=new_value#new_hash';
```

### currentPath

Returns the active path

```javascript
import { currentPath } from '/node_modules/@gluon/router/gluon-router.js';

// If the current url is https://example.com/path?query=value#hash
currentPath() === '/path';
```

### currentQuery

Returns the active query component

```javascript
import { currentQuery } from '/node_modules/@gluon/router/gluon-router.js';

// If the current url is https://example.com/path?query=value#hash
currentQuery() === 'query=value';
```

### currentHash

Returns the active hash

```javascript
import { currentHash } from '/node_modules/@gluon/router/gluon-router.js';

// If the current url is https://example.com/path?query=value#hash
currentHash() === 'hash';
```

# About Gluon

[Gluon](https://gitub.com/ruphin/gluonjs) is a lightweight Web Component library designed for simplicity and speed. It borrows some ideas from [Polymer](https://www.polymer-project.org/), but is mostly based on platform features.
