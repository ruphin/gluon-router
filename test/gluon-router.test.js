import { describe, it, expect, beforeEach, vi } from 'vitest';

const BASE = 'http://localhost:3000/';

// The router keeps module-level state, so load a fresh copy for each test and
// give it a fresh <body> (the click listener is attached to document.body).
let router;
beforeEach(async () => {
  window.history.replaceState({}, '', BASE);
  document.documentElement.replaceChild(document.createElement('body'), document.body);
  vi.resetModules();
  router = await import('../src/gluon-router.js');
});

// Adds a link and reports whether its click was intercepted (default prevented).
// A click that is not prevented would make the browser navigate to the link.
const clickLink = href => {
  const link = document.createElement('a');
  link.href = href;
  document.body.appendChild(link);
  let prevented;
  const observe = event => {
    prevented = event.defaultPrevented;
    // Stop jsdom from attempting a real (unimplemented) navigation.
    event.preventDefault();
  };
  window.addEventListener('click', observe);
  link.click();
  window.removeEventListener('click', observe);
  return prevented;
};

describe('GluonRouter', () => {
  describe('onRouteChange', () => {
    it('should do nothing when not navigating', () => {
      const callback = vi.fn();
      router.onRouteChange(callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should fire callback upon hashchange', async () => {
      const callback = vi.fn();
      router.onRouteChange(callback);
      window.location.hash = 'test';
      await vi.waitFor(() => expect(callback).toHaveBeenCalledWith('/', '', 'test'));
    });

    it('should fire callback upon location-changed', () => {
      const callback = vi.fn();
      router.onRouteChange(callback);
      window.dispatchEvent(new Event('location-changed'));
      expect(callback).toHaveBeenCalled();
    });

    it('should fire callback upon popstate', async () => {
      const callback = vi.fn();
      router.onRouteChange(callback);
      window.history.pushState({}, 'test', '/popstate');
      expect(window.location.href).toBe(`${BASE}popstate`);
      window.history.back();
      await vi.waitFor(() => expect(callback).toHaveBeenCalled());
      expect(window.location.href).toBe(BASE);
    });
  });

  describe('interceptLinks', () => {
    it('should not intercept links before being activated', () => {
      expect(clickLink('/some/internal/link')).toBe(false);
      expect(window.location.href).toBe(BASE);
    });

    it('should not intercept cross domain links', () => {
      router.interceptLinks();
      expect(clickLink('http://example.com')).toBe(false);
      expect(window.location.href).toBe(BASE);
    });

    it('should intercept all same domain links by default', () => {
      const callback = vi.fn();
      router.onRouteChange(callback);
      router.interceptLinks();
      expect(clickLink('/some/internal/link')).toBe(true);
      expect(window.location.href).toBe(`${BASE}some/internal/link`);
      expect(callback).toHaveBeenCalledWith('/some/internal/link', '', '');
    });

    it('should not intercept links that are exluded', () => {
      router.interceptLinks({ exclude: [/\/internal\/link/] });
      expect(clickLink('/some/internal/link')).toBe(false);
    });

    it('should not intercept links that are not included', () => {
      router.interceptLinks({ include: [/\/some\/other\/link/] });
      expect(clickLink('/some/internal/link')).toBe(false);
    });

    it('should not intercept links that are included but also excluded', () => {
      router.interceptLinks({ include: [/\/link/], exclude: [/\/internal\/link/] });
      expect(clickLink('/some/internal/link')).toBe(false);
    });

    it('should intercept links that are included', () => {
      router.interceptLinks({ include: [/\/link/] });
      expect(clickLink('/some/internal/link')).toBe(true);
      expect(window.location.href).toBe(`${BASE}some/internal/link`);
    });

    it('should intercept links that are included and not excluded', () => {
      router.interceptLinks({ include: [/\/link/], exclude: [/\/other\/internal\/link/] });
      expect(clickLink('/some/internal/link')).toBe(true);
      expect(window.location.href).toBe(`${BASE}some/internal/link`);
    });
  });

  describe('currentPath', () => {
    it('should equal the current path', () => {
      window.history.replaceState({}, '', '/test/currentPath.html');
      expect(router.currentPath()).toBe('/test/currentPath.html');
    });
  });

  describe('currentHash', () => {
    it('should be empty when there is no hash', () => {
      expect(router.currentHash()).toBe('');
    });
    it('should equal the current hash', () => {
      window.history.replaceState({}, '', '#some-hash');
      expect(router.currentHash()).toBe('some-hash');
    });
  });

  describe('currentQuery', () => {
    it('should be empty when there is no query parameter', () => {
      expect(router.currentQuery()).toBe('');
    });
    it('should equal the current query', () => {
      window.history.replaceState({}, '', '?some=query');
      expect(router.currentQuery()).toBe('some=query');
    });
  });
});
