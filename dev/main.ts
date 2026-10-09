// Import by package name, exactly as a consumer would.
// dev/vite.config.ts aliases the package to ../src during development.
import {
  interceptLinks,
  onRouteChange,
  currentPath,
  currentQuery,
  currentHash,
} from "@gluon/router";

const log = document.querySelector<HTMLElement>("#log")!;
const show = (path: string, query: string, hash: string) => {
  log.textContent = `path:  ${path}\nquery: ${query}\nhash:  ${hash}`;
};

show(currentPath(), currentQuery(), currentHash());
onRouteChange(show);
interceptLinks({ exclude: [/\/excluded/] });
