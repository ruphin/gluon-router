/** Called after every navigation with the path, query and hash of the new location. */
export type RouteChangeCallback = (
  path: string,
  query: string,
  hash: string,
) => void;

export interface InterceptLinksOptions {
  /** Paths to intercept. When omitted, every same-origin path is intercepted. */
  include?: RegExp[];
  /** Paths that must never be intercepted, even when they match `include`. */
  exclude?: RegExp[];
}

let observingRouteChanges = false;
let interceptingLinks = false;
const routeChangeCallbacks: RouteChangeCallback[] = [];
const paths = {
  all: false,
  included: [] as RegExp[],
  excluded: [] as RegExp[],
};

/** Enable intercepting clicks on anchor elements. */
export const interceptLinks = ({
  include,
  exclude = [],
}: InterceptLinksOptions = {}): void => {
  // On first call, set up the global click listener
  if (!interceptingLinks) {
    document.body.addEventListener("click", globalClickHandler);
    interceptingLinks = true;
  }

  // If we don't provide an `include` array, assume that we want to intercept all paths
  if (include === undefined) {
    paths.all = true;
  } else if (!paths.all) {
    // If we are not already intercepting all paths, add the included paths to the list
    paths.included.push(...include);
  }

  paths.excluded.push(...exclude);
};

/** Register a callback that is called whenever the location changes. */
export const onRouteChange = (callback: RouteChangeCallback): void => {
  // On first call, set up listeners for route changes
  if (!observingRouteChanges) {
    window.addEventListener("hashchange", notifyRouteChange);
    window.addEventListener("location-changed", notifyRouteChange);
    window.addEventListener("popstate", notifyRouteChange);
    observingRouteChanges = true;
  }

  // Add the callback to the list
  routeChangeCallbacks.push(callback);
};

/** Navigate to `href` and notify `onRouteChange` callbacks. */
export const changeRoute = (href: string): void => {
  // If the navigation is to the current page we shouldn't add a history
  // entry or fire a change event.
  if (href === window.location.href) {
    return;
  }

  // Add a new navigation state to the browser history, and dispatch an event
  // to let observers know we changed location
  window.history.pushState({}, "", href);
  window.dispatchEvent(new Event("location-changed"));
};

/** The decoded path of the current location. */
export const currentPath = (): string =>
  decodeURIComponent(window.location.pathname);

/** The query string of the current location, without the leading `?`. */
export const currentQuery = (): string => window.location.search.slice(1);

/** The decoded hash of the current location, without the leading `#`. */
export const currentHash = (): string =>
  decodeURIComponent(window.location.hash.slice(1));

/** Resolve `path` against `base` into a full URL. */
export const resolveURL = (path: string, base?: string | URL | null): URL =>
  new URL(path, base ?? undefined);

const globalClickHandler = (event: MouseEvent): void => {
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
  if (
    !href ||
    (!paths.all && !paths.included.some((path) => path.test(href))) ||
    paths.excluded.some((path) => path.test(href))
  ) {
    return;
  }

  // Stop the browser from navigating
  event.preventDefault();

  // Signal the route change event handler and update the address
  changeRoute(href);
};

const isAnchor = (target: EventTarget): target is HTMLAnchorElement =>
  target instanceof Element &&
  target.tagName === "A" &&
  (target as HTMLAnchorElement).href !== "";

const getSameOriginLinkHref = (event: MouseEvent): string | null => {
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
  const anchor = event.composedPath().find(isAnchor);

  // If there's no link there's nothing to do.
  if (!anchor) {
    return null;
  }

  // Target blank is a new tab, don't intercept.
  if (anchor.target === "_blank") {
    return null;
  }

  // If the link is for an existing parent frame, don't intercept.
  if (
    (anchor.target === "_top" || anchor.target === "_parent") &&
    window.top !== window
  ) {
    return null;
  }

  const url = resolveURL(anchor.href, document.baseURI);

  // It only makes sense for us to intercept same-origin navigations.
  // pushState/replaceState don't work with cross-origin links.
  if (url.origin !== window.location.origin) {
    return null;
  }

  // Need to use a full URL in case the containing page has a base URI.
  return resolveURL(url.pathname + url.search + url.hash, window.location.href)
    .href;
};

const notifyRouteChange = (): void => {
  routeChangeCallbacks.forEach((callback) =>
    callback(currentPath(), currentQuery(), currentHash()),
  );
};
