# gluon-router

A simple router exposed as an ES6 module. If enabled, it intercepts browser navigation to same-origin locations, and fires a callback instead.

## Usage

```javascript
import { onRouteChange } from '/src/gluon-router.js';

// This callback is fired whenever a navigation takes place, and passes the path, query parameters, and hash of the new location
onRouteChange((path, query, hash) => {
  console.log('PATH: ', path);
  console.log('QUERY: ', query);
  console.log('HASH: ', hash);
});
```

# About Gluonjs

[Gluonjs](https://gluonjs.ruph.in/) is a lightweight Web Component library designed for simplicity and speed. It borrows some ideas from [Polymer](https://www.polymer-project.org/), but is mostly based on platform features. [The source](https://github.com/ruphin/gluonjs/blob/master/src/gluon.js) is only ~40 lines of javascript.
