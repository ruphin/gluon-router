import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as router from "../src/index.js";

// Guards the packaging contract: the package has no registering modules, so
// it may be marked side-effect free, and the barrel must expose the full API.
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  sideEffects: unknown;
  exports: Record<string, unknown>;
};

describe("package.json", () => {
  it("is side-effect free with a single entrypoint", () => {
    expect(pkg.sideEffects).toBe(false);
    expect(Object.keys(pkg.exports)).toEqual([".", "./package.json"]);
  });
});

describe("entrypoint", () => {
  it("exports the public API", () => {
    expect(Object.keys(router).sort()).toEqual([
      "changeRoute",
      "currentHash",
      "currentPath",
      "currentQuery",
      "interceptLinks",
      "onRouteChange",
      "resolveURL",
    ]);
  });
});
