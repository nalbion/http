var sharedConfig = require('pipe/karma');

module.exports = function(config) {
  sharedConfig(config);

  config.set({
    // list of files / patterns to load in the browser
    files: [
      'test-main.js',

      {pattern: 'src/**/*.js', included: false},
      {pattern: 'test/**/*.js', included: false},
      {pattern: 'node_modules/rtts-assert/dist/amd/**/*.js', included: false},
      {pattern: 'node_modules/di/src/*.js', included: false},
      {pattern: 'node_modules/di/node_modules/es6-shim/es6-shim.js', included: false},
      {pattern: 'node_modules/di/node_modules/q/q.js', included: false},
      {pattern: 'node_modules/deferred/src/*.js', included: false},
      {pattern: 'node_modules/zone.js/zone.js', included: true}
    ],

    preprocessors: {
      'node_modules/deferred/src/*.js': ['traceur'],
      'node_modules/di/src/*.js': ['traceur'],
      'src/**/*.js': ['traceur'],
      'test/**/*.js': ['traceur'],
    }
  });

  // this should be in shared config (pipe)
  config.traceurPreprocessor.options.typeAssertions = true;
  config.traceurPreprocessor.options.typeAssertionModule = 'assert';

  config.sauceLabs.testName = 'ngHttp';
};
