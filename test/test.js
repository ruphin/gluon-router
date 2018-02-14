const puppeteer = require('puppeteer');
const { expect } = require('chai');
const browserSync = require('browser-sync').create();

let browser = null;
let page = null;

before(async () => {
  // Workaround till https://github.com/GoogleChrome/puppeteer/issues/290 is fixed
  browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  page = await browser.newPage();
  await page.setViewport({
    width: 1024,
    height: 768
  });
  await new Promise(resolve =>
    browserSync.init(
      {
        port: 5000,
        notify: false,
        open: false,
        ui: false,
        logLevel: 'silent',
        server: {
          baseDir: ['.', 'node_modules']
        }
      },
      resolve
    )
  );
});

after(async () => {
  await browser.close();
  browserSync.exit();
});

describe('GluonRouter', () => {
  describe(`onRouteChange`, () => {
    beforeEach(async () => {
      await page.goto('http://localhost:5000/test/test-onRouteChange.html');
    });
    it('should do nothing when not navigating', async () => {
      const callbackCalled = await page.evaluate(() => {
        let called = false;
        window.onRouteChange(() => called = true);
        return called;
      });
      expect(callbackCalled).to.be.false;
    });

    it('should fire callback upon hashchange', async () => {
      const callbackCalled = await page.evaluate(() => {
        let called = false;
        window.onRouteChange(() => called = true);
        document.getElementById('hashLink').click();
        return called;
      });
      expect(callbackCalled).to.be.true;
    });
    it('should fire callback upon location-changed', async () => {
      const callbackCalled = await page.evaluate(() => {
        let called = false;
        window.onRouteChange(() => called = true);
        window.dispatchEvent(new Event('location-changed'));
        return called;
      });
      expect(callbackCalled).to.be.true;
    });
    // This test is broken due to a bug in Puppeteer:
    // https://github.com/GoogleChrome/puppeteer/issues/865#issuecomment-355674062
    //
    // it('should fire callback upon popstate', async () => {
    //   const callbackCalled = await page.evaluate(async () => {
    //     called = false;
    //     window.onRouteChange(() => called = true);
    //     window.history.pushState({}, 'test', '#test');
    //     window.history.back();
    //     return called
    //   });
    //   expect(callbackCalled).to.be.true;
    // });
  });
});
