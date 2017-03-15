var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var del = require('del');

gulp.task('bower', function() {
  console.log("Copying bower components.");
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
  console.log("Bundling files with browserify.");
  return browserify('./scripts/map.js')
      .bundle()
      .pipe(source('map.js'))
      .pipe(gulp.dest('./scripts/build/'))
    &&
    browserify('./scripts/popup.js')
      .bundle()
      .pipe(source('popup.js'))
      .pipe(gulp.dest('./scripts/build/'));
});

gulp.task('build', ['bower', 'browserify']);

gulp.task('clean', function() {
  return del([
      'scripts/lib',
      'scripts/build',
      'style/lib'
    ]);
});