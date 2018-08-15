let observingRouteChanges = false;
let interceptingLinks = false;
const routeChangeCallbacks = [];
const paths = { all: false, included: [], excluded: [] };

// Enable intercepting clicks on anchor elements
export const interceptLinks = ({ include = undefined, exclude = [] } = {}) => {
  // On first call, set up global click listener and enable the Event polyfill
  if (!interceptingLinks) {
    document.body.addEventListener('click', globalClickHandler);
    polyfillEvent();
    interceptingLinks = true;
  }

  // If we don't provide an `include` array, assume that we want to intercept all paths
  if (include === undefined) {
    paths.all = true;
  } else {
    // If we are not already intercepting all paths, add the included paths to the list
    if (!paths.all) {
      Array.prototype.push.apply(paths.included, include);
    }
  }

  Array.prototype.push.apply(paths.excluded, exclude);
};

export const onRouteChange = callback => {
  // On first call, set up listeners for route changes
  if (!observingRouteChanges) {
    window.addEventListener('hashchange', notifyRouteChange);
    window.addEventListener('location-changed', notifyRouteChange);
    window.addEventListener('popstate', notifyRouteChange);
    observingRouteChanges = true;
  }

  // Add the callback to the list
  routeChangeCallbacks.push(callback);
};

const globalClickHandler = event => {
  // Ignore this event if it has already been handled by another service
  if (event.defaultPrevented) {
    return;
  }

  // Get the href if the target of this click was a link
  const href = getSameOriginLinkHref(event);

  // If no link was clicked,
  // or if we have not enabled link interception on all paths
  // and the link does not match one of the included paths,
  // or if the link matches one of the explicitly excluded paths,
  // do nothing.
  if (!href || (!paths.all && !paths.included.some(path => path.test(href))) || paths.excluded.some(path => path.test(href))) {
    return;
  }

  // Stop the browser from navigating
  event.preventDefault();
  
  // Signal the route change event handler and update the address
  changeRoute(href);
};

export const changeRoute = (href) => {
  // If the navigation is to the current page we shouldn't add a history
  // entry or fire a change event.
  if (href === window.location.href) {
    return;
  }
  
  // Add a new navigation state to the browser history, and dispatch an event
  // to let observers know we changed location
  window.history.pushState({}, '', href);
  window.dispatchEvent(new Event('location-changed'));
};

const getSameOriginLinkHref = event => {
  // We only care about left-clicks.
  if (event.button !== 0) {
    return null;
  }

  // We don't want modified clicks, where the intent is to open the page
  // in a new tab.
  if (event.metaKey || event.ctrlKey) {
    return null;
  }

  let anchor = null;
  // Find the first link in the event path
  event.composedPath().some(element => {
    if (element.tagName === 'A' && element.href) {
      anchor = element;
      return true;
    }
  });

  // If there's no link there's nothing to do.
  if (!anchor) {
    return null;
  }

  // Target blank is a new tab, don't intercept.
  if (anchor.target === '_blank') {
    return null;
  }

  // If the link is for an existing parent frame, don't intercept.
  if ((anchor.target === '_top' || anchor.target === '_parent') && window.top !== window) {
    return null;
  }

  const href = anchor.href;
  const url = resolveURL(href, document.baseURI);

  // It only makes sense for us to intercept same-origin navigations.
  // pushState/replaceState don't work with cross-origin links.
  let urlOrigin;
  if (url.origin) {
    urlOrigin = url.origin;
  } else {
    urlOrigin = url.protocol + '//' + url.host;
  }
  if (urlOrigin !== window.location.origin) {
    return null;
  }

  let normalizedHref = url.pathname + url.search + url.hash;
  // pathname should start with '/', but may not if `new URL` is not supported
  if (normalizedHref[0] !== '/') {
    normalizedHref = '/' + normalizedHref;
  }

  // Need to use a full URL in case the containing page has a base URI.
  return resolveURL(normalizedHref, window.location.href).href;
};

const notifyRouteChange = () => {
  routeChangeCallbacks.forEach(callback => callback(currentPath(), currentQuery(), currentHash()));
};

export const currentPath = () => {
  return window.decodeURIComponent(window.location.pathname);
};

export const currentQuery = () => {
  return window.location.search.slice(1);
};

export const currentHash = () => {
  return window.decodeURIComponent(window.location.hash.slice(1));
};

// Cache for resolveURL
let workingURL;
let resolveDoc;

// Helper method to resolve a path to a full URL.
export const resolveURL = (path, base) => {
  if (base === null) {
    base = undefined;
  }
  // Feature detect URL
  if (workingURL === undefined) {
    workingURL = false;
    try {
      const u = new URL('b', 'http://a');
      u.pathname = 'c%20d';
      workingURL = u.href === 'http://a/c%20d';
      workingURL = workingURL && new URL('http://a/?b c').href === 'http://a/?b%20c';
    } catch (e) {
      // silently fail
    }
  }

  if (workingURL) {
    return new URL(path, base);
  }

  // Fallback to creating an anchor into a disconnected document.
  if (!resolveDoc) {
    resolveDoc = document.implementation.createHTMLDocument('temp');
    resolveDoc.base = resolveDoc.createElement('base');
    resolveDoc.head.appendChild(resolveDoc.base);
    resolveDoc.anchor = resolveDoc.createElement('a');
  }
  resolveDoc.base.href = base;
  resolveDoc.anchor.href = path;
  return resolveDoc.anchor;
};

// This polyfills certain features of Event that are required for the link interception to work
// It is a no-op on modern browsers
const polyfillEvent = () => {
  // Polyfill composedPath() for old browsers (and Edge)
  // This version excludes `document` and `window` from the path for simplicity
  if (!Event.prototype.composedPath) {
    Event.prototype.composedPath = function composedPath() {
      let element = this.target;
      if (!element) {
        return [];
      }

      const path = [element];
      while (element.parentElement) {
        element = element.parentElement;
        path.push(element);
      }
      return path;
    };
  }

  // Polyfill Event() constructor for old browsers
  if (typeof window.Event !== 'function') {
    const Event = function Event(event, { bubbles = false, cancelable = false } = {}) {
      const evt = document.createEvent('Event');
      evt.initEvent(event, bubbles, cancelable);
      return evt;
    };
    Event.prototype = window.Event.prototype;
    window.Event = Event;
  }
};
