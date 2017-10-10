let routingEnabled = false;
const routeChangeCallbacks = [];

export const onRouteChange = callback => {
  if (!routingEnabled) {
    // Set up listeners for route changes
    window.addEventListener('hashchange', notifyRouteChange);
    window.addEventListener('location-changed', notifyRouteChange);
    window.addEventListener('popstate', notifyRouteChange);
    document.body.addEventListener('click', globalClickHandler);
    routingEnabled = true;
  }

  routeChangeCallbacks.push(callback);
};

const globalClickHandler = event => {
  // If another event handler has stopped this event then there's nothing
  // for us to do. This can happen e.g. when there are multiple
  // iron-location elements in a page.
  if (event.defaultPrevented) {
    return;
  }

  // Get the href if the target of this click was a link
  const href = getSameOriginLinkHref(event);

  // If no link was clicked, there's nothing to do
  if (!href) {
    return;
  }

  // Stop the browser from navigating
  event.preventDefault();

  // If the navigation is to the current page we shouldn't add a history
  // entry or fire a change event.
  if (href === window.location.href) {
    return;
  }

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

  // Find the first link in the event path
  const eventPath = event.path || (event.composedPath && event.composedPath());
  let anchor = null;
  for (var i = 0; i < eventPath.length; i++) {
    var element = eventPath[i];
    if (element.tagName === 'A' && element.href) {
      anchor = element;
      break;
    }
  }

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
