var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var del = require('del');
var watchify = require('watchify');
var notify = require('gulp-notify');
var gutil = require('gutil');

var scriptsDir = './scripts';
var buildDir = './scripts/build';

gulp.task('bower', function() {
  gutil.log("Copying bower components.");
  gulp.src("bower_components/bootstrap/dist/css/bootstrap.min.css")
    .pipe(gulp.dest("style/lib"));

  gulp.src("bower_components/d3/d3.min.js")
    .pipe(gulp.dest("scripts/lib"));

  gulp.src("bower_components/Ionicons/css/ionicons.min.css")
    .pipe(gulp.dest("style/lib/Ionicons/css"));

  gulp.src("bower_components/Ionicons/fonts/ionicons.*")
    .pipe(gulp.dest("style/lib/Ionicons/fonts"));

});

gulp.task('browserify', function() {
  gutil.log("Bundling files with browserify.");
  return browserify('./scripts/map.js')
      .bundle()
      .pipe(source('map.js'))
      .pipe(gulp.dest(buildDir))
    &&
    browserify('./scripts/popup.js')
      .bundle()
      .pipe(source('popup.js'))
      .pipe(gulp.dest(buildDir));
});

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: "Compile Error",
    message: "<%= error.message %>"
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

function build(file, watch) {
  var props = {entries: [file], debug: true};
  var bundler = watch ? watchify(browserify(props)) : browserify(props);
  function rebundle() {
    return bundler
      .bundle()
      .on('error', handleErrors)
      .pipe(source(file))
      .pipe(gulp.dest(buildDir));
  }
  bundler.on('update', function() {
    rebundle();
    gutil.log('Rebundle...');
  });
  return rebundle();
}

gulp.task('build', ['bower'], function() {
  return build(scriptsDir + '/' + 'map.js', false) &&
         build(scriptsDir + '/' + 'popup.js', false);
});

gulp.task('default', ['build'], function() {
  return build(scriptsDir + '/' + 'map.js', true) && 
         build(scriptsDir + '/' + 'popup.js', true);
});

gulp.task('clean', function() {
  return del([
      'scripts/lib',
      buildDir,
      'style/lib'
    ]);
});