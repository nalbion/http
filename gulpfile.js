var gulp = require('gulp');
var pipe = require('pipe/gulp');
var connect = require('gulp-connect');
var karma = require('./lib/gulp/karma');
var ts = require('gulp-typescript');
var merge = require('merge2');

var path = {
  src: './src/**/*.ts',
  // we have to skip example/node (because of the cyclic symlink)
  examples: './example/!(node)/**/*.js'
};

var tsProject = {
  typescript: require('typescript'),
  sourceRoot: 'src',
  sortOutput: true,
  declarationFiles: true,
  noExternalResolve: false,
  //emitDecoratorMetadata: true,
  target: 'ES5',
  module: 'amd'
};

var cjsProject = JSON.parse(JSON.stringify(tsProject));
cjsProject.module = 'commonjs';

// TRANSPILE ES6
gulp.task('build_source_amd', function() {
  var tsResult = gulp.src([path.src,
                            //'node-modules/di/src/annotations.js',
                            //'node-modules/di/dist/cjs/annotations.js',
                            //'node-modules/di/src/injector.js',
                            //'node-modules/prophecy/src/Deferred.js'
                    ])
                    //.pipe(sourcemaps.init())
                    //.pipe(pipe.traceur())
                    .pipe(ts(tsProject, {}, ts.reporter.longReporter()));

    return merge(
        tsResult.js
                //.pipe(ts.filter(tsProject, { referencedFrom: ['index.ts'] }))
                //.pipe(sourcemaps.write())
                .pipe(gulp.dest('dist/amd')),
        tsResult.dts.pipe(gulp.dest('dist'))
    );
});

gulp.task('build_source_cjs', function() {
  var tsResult = gulp.src(path.src)
                    //.pipe(sourcemaps.init())
                    //.pipe(pipe.traceur())
                    .pipe(ts(cjsProject, {}, ts.reporter.longReporter()));

  return merge(
        tsResult.js
            //.pipe(sourcemaps.write())
            .pipe(gulp.dest('dist/cjs')),
        tsResult.dts.pipe(gulp.dest('dist'))
    );
});

gulp.task('build_examples', function() {
  gulp.src(path.examples)
      .pipe(pipe.traceur())
      .pipe(gulp.dest('compiled/example'));
});

gulp.task('build_dist', ['build_source_cjs', 'build_source_amd']);
gulp.task('build', ['build_dist', 'build_examples']);


// WATCH FILES FOR CHANGES
gulp.task('watch', function() {
  gulp.watch(path.src, ['build']);
});


// WEB SERVER
gulp.task('serve', connect.server({
  root: __dirname,
  port: 8000,
  open: {
    browser: 'Google Chrome'
  }
}));

// TEST
gulp.task('test', function(done) {
  var options = {
    configFile: 'karma.conf.js'
  };
  for (var i=0, ii = process.argv.length; i<ii; ++i) {
    var val = process.argv[i];
    if (val === '--debug') options.debugRun = true;
    if (val === '--watch') options.autoWatch = true;
    else if (val === '--single-run') options.singleRun = true;
    else if (val === '--browsers') options.browsers = process.argv[++i].split(',');
  }
  karma(options, done);
});


gulp.task('typescript:rename', function() {
    var rename = require('gulp-rename');

    gulp.src('src/*.js')
        .pipe(rename(function (path) {
            path.extname = ".ts"
        }))
        .pipe(gulp.dest('src'));
});

gulp.task('d.ts', function() {
    require('dts-generator').generate({
        name: 'http',
        baseDir: 'src',
        files: [ 'index.ts', '*.ts' ],
        out: 'dist/http.d.ts'
    });
});