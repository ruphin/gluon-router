// Pure public entrypoint: helpers and types only. Nothing in here may have
// side effects at import time; listeners are only attached when
// interceptLinks() or onRouteChange() is called.
export {
  interceptLinks,
  onRouteChange,
  changeRoute,
  currentPath,
  currentQuery,
  currentHash,
  resolveURL,
} from "./router.js";
export type { RouteChangeCallback, InterceptLinksOptions } from "./router.js";
