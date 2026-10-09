import { beforeEach, describe, expect, it, vi } from "vitest";

const BASE = "http://localhost:3000/";

// The router keeps module-level state, so load a fresh copy for each test and
// give it a fresh <body> (the click listener is attached to document.body).
let router: typeof import("./router.js");
beforeEach(async () => {
  window.history.replaceState({}, "", BASE);
  document.documentElement.replaceChild(
    document.createElement("body"),
    document.body,
  );
  vi.resetModules();
  router = await import("./router.js");
});

interface ClickOptions {
  /** Value for the anchor's `target` attribute. */
  target?: string;
  /** Extra MouseEvent init, for modifier keys and buttons. */
  init?: MouseEventInit;
  /** Dispatch the click on an element nested inside the anchor. */
  nested?: boolean;
}

// Adds a link and reports whether its click was intercepted (default prevented).
// A click that is not prevented would make the browser navigate to the link.
const clickLink = (
  href: string,
  { target, init = {}, nested = false }: ClickOptions = {},
): boolean | undefined => {
  const link = document.createElement("a");
  link.href = href;
  if (target) {
    link.target = target;
  }
  let clickTarget: Element = link;
  if (nested) {
    clickTarget = document.createElement("span");
    link.appendChild(clickTarget);
  }
  document.body.appendChild(link);
  let prevented: boolean | undefined;
  const observe = (event: Event) => {
    prevented = event.defaultPrevented;
    // Stop the test environment from attempting a real navigation.
    event.preventDefault();
  };
  window.addEventListener("click", observe);
  clickTarget.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      composed: true,
      button: 0,
      ...init,
    }),
  );
  window.removeEventListener("click", observe);
  return prevented;
};

describe("onRouteChange", () => {
  it("does nothing when not navigating", () => {
    const callback = vi.fn();
    router.onRouteChange(callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("fires the callback upon hashchange", async () => {
    const callback = vi.fn();
    router.onRouteChange(callback);
    window.location.hash = "test";
    await vi.waitFor(() =>
      expect(callback).toHaveBeenCalledWith("/", "", "test"),
    );
  });

  it("fires the callback upon location-changed", () => {
    const callback = vi.fn();
    router.onRouteChange(callback);
    window.dispatchEvent(new Event("location-changed"));
    expect(callback).toHaveBeenCalled();
  });

  it("fires the callback upon popstate", async () => {
    const callback = vi.fn();
    router.onRouteChange(callback);
    window.history.pushState({}, "test", "/popstate");
    expect(window.location.href).toBe(`${BASE}popstate`);
    window.history.back();
    await vi.waitFor(() => expect(callback).toHaveBeenCalled());
    expect(window.location.href).toBe(BASE);
  });
});

describe("interceptLinks", () => {
  it("does not intercept links before being activated", () => {
    expect(clickLink("/some/internal/link")).toBe(false);
    expect(window.location.href).toBe(BASE);
  });

  it("does not intercept cross domain links", () => {
    router.interceptLinks();
    expect(clickLink("http://example.com")).toBe(false);
    expect(window.location.href).toBe(BASE);
  });

  it("intercepts all same domain links by default", () => {
    const callback = vi.fn();
    router.onRouteChange(callback);
    router.interceptLinks();
    expect(clickLink("/some/internal/link")).toBe(true);
    expect(window.location.href).toBe(`${BASE}some/internal/link`);
    expect(callback).toHaveBeenCalledWith("/some/internal/link", "", "");
  });

  it("does not intercept links that are excluded", () => {
    router.interceptLinks({ exclude: [/\/internal\/link/] });
    expect(clickLink("/some/internal/link")).toBe(false);
  });

  it("does not intercept links that are not included", () => {
    router.interceptLinks({ include: [/\/some\/other\/link/] });
    expect(clickLink("/some/internal/link")).toBe(false);
  });

  it("does not intercept links that are included but also excluded", () => {
    router.interceptLinks({
      include: [/\/link/],
      exclude: [/\/internal\/link/],
    });
    expect(clickLink("/some/internal/link")).toBe(false);
  });

  it("intercepts links that are included", () => {
    router.interceptLinks({ include: [/\/link/] });
    expect(clickLink("/some/internal/link")).toBe(true);
    expect(window.location.href).toBe(`${BASE}some/internal/link`);
  });

  it("intercepts links that are included and not excluded", () => {
    router.interceptLinks({
      include: [/\/link/],
      exclude: [/\/other\/internal\/link/],
    });
    expect(clickLink("/some/internal/link")).toBe(true);
    expect(window.location.href).toBe(`${BASE}some/internal/link`);
  });

  it("intercepts clicks on elements nested inside a link", () => {
    router.interceptLinks();
    expect(clickLink("/some/internal/link", { nested: true })).toBe(true);
    expect(window.location.href).toBe(`${BASE}some/internal/link`);
  });

  it('does not intercept links with target="_blank"', () => {
    router.interceptLinks();
    expect(clickLink("/some/internal/link", { target: "_blank" })).toBe(false);
    expect(window.location.href).toBe(BASE);
  });

  it("does not intercept modified clicks", () => {
    router.interceptLinks();
    expect(clickLink("/some/internal/link", { init: { ctrlKey: true } })).toBe(
      false,
    );
    expect(clickLink("/some/internal/link", { init: { metaKey: true } })).toBe(
      false,
    );
    expect(window.location.href).toBe(BASE);
  });

  it("does not intercept non-primary button clicks", () => {
    router.interceptLinks();
    expect(clickLink("/some/internal/link", { init: { button: 1 } })).toBe(
      false,
    );
    expect(window.location.href).toBe(BASE);
  });

  it("does not intercept clicks that were already handled", () => {
    router.interceptLinks();
    document.body.addEventListener("click", (event) => event.preventDefault(), {
      capture: true,
    });
    clickLink("/some/internal/link");
    expect(window.location.href).toBe(BASE);
  });
});

describe("changeRoute", () => {
  it("updates the location and notifies callbacks", () => {
    const callback = vi.fn();
    router.onRouteChange(callback);
    router.changeRoute("/new_path?query=new_value#new_hash");
    expect(window.location.href).toBe(
      `${BASE}new_path?query=new_value#new_hash`,
    );
    expect(callback).toHaveBeenCalledWith(
      "/new_path",
      "query=new_value",
      "new_hash",
    );
  });

  it("does nothing when navigating to the current location", () => {
    const callback = vi.fn();
    router.onRouteChange(callback);
    const length = window.history.length;
    router.changeRoute(BASE);
    expect(window.history.length).toBe(length);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("resolveURL", () => {
  it("resolves a path against a base", () => {
    expect(router.resolveURL("/a/b", "http://example.com/c/").href).toBe(
      "http://example.com/a/b",
    );
  });

  it("treats a null base as absent", () => {
    expect(router.resolveURL("http://example.com/x", null).href).toBe(
      "http://example.com/x",
    );
  });
});

describe("currentPath", () => {
  it("equals the current path", () => {
    window.history.replaceState({}, "", "/test/currentPath.html");
    expect(router.currentPath()).toBe("/test/currentPath.html");
  });
});

describe("currentHash", () => {
  it("is empty when there is no hash", () => {
    expect(router.currentHash()).toBe("");
  });
  it("equals the current hash", () => {
    window.history.replaceState({}, "", "#some-hash");
    expect(router.currentHash()).toBe("some-hash");
  });
});

describe("currentQuery", () => {
  it("is empty when there is no query parameter", () => {
    expect(router.currentQuery()).toBe("");
  });
  it("equals the current query", () => {
    window.history.replaceState({}, "", "?some=query");
    expect(router.currentQuery()).toBe("some=query");
  });
});
