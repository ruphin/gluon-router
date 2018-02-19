import filesize from 'rollup-plugin-filesize';
import uglify from 'rollup-plugin-uglify';
import { uglifier } from 'uglify-es';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

function getConfig({ dest, format, uglified = true, transpiled = false }) {
  const conf = {
    input: 'src/gluon-router.js',
    output: { exports: 'named', file: dest, format, name: 'GluonRouter', sourcemap: true },
    plugins: [
      transpiled && resolve(),
      transpiled &&
        commonjs({
          include: 'node_modules/**'
        }),
      transpiled &&
        babel({
          presets: [['env', { modules: false }]],
          plugins: ['transform-runtime'],
          runtimeHelpers: true,
          exclude: 'node_modules/**'
        }),
      uglified && uglify({ warnings: true, toplevel: !transpiled, sourceMap: true, compress: { passes: 2 }, mangle: { properties: false } }, uglifier),
      filesize()
    ].filter(Boolean)
  };

  return conf;
}

const config = [
  getConfig({ dest: 'gluon-router.es5.js', format: 'iife', transpiled: true }),
  getConfig({ dest: 'gluon-router.umd.js', format: 'umd' }),
  getConfig({ dest: 'gluon-router.js', format: 'es' })
];

export default config;
