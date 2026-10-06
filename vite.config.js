import { defineConfig } from 'vite';

// Library build: emits the published files into the package root, matching the
// paths in package.json (main/module/umd:main) and the `files` field.
export default defineConfig({
  build: {
    outDir: '.',
    emptyOutDir: false,
    copyPublicDir: false,
    sourcemap: true,
    target: 'es2015',
    lib: {
      entry: 'src/gluon-router.js',
      name: 'GluonRouter',
      formats: ['es', 'umd', 'iife'],
      fileName: format => ({ es: 'gluon-router.js', umd: 'gluon-router.umd.js', iife: 'gluon-router.es5.js' })[format]
    }
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost:3000/' } }
  }
});
