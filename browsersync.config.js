historyApiFallback = require('connect-history-api-fallback');

module.exports = {
  port: 5000,
  notify: false,
  open: false,
  ui: false,
  logPrefix: 'APP',
  snippetOptions: {
    rule: {
      match: '<span id="browser-sync-binding"></span>',
      fn: function(snippet) {
        return snippet;
      }
    }
  },
  server: {
    baseDir: ['.', 'node_modules'],
    middleware: [historyApiFallback()]
  },
  files: ['index.html', 'src/*.js']
};
