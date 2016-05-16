// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass   = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var htmlmin = require('gulp-htmlmin');
var bower = require('gulp-bower-src');
var image = require('gulp-image');
var gulpFilter = require('gulp-filter');
var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var del    = require('del');
var config = require('./config');
var delConfig = config.del;

// Lint Task
gulp.task('lint', function() {
  return gulp.src('js/*.js')
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
});

// Compile Sass
gulp.task('dev:sass', function() {
  return gulp.src('scss/**/*.scss')
      .pipe(sass())
      .pipe(gulpFilter('**/style.css'))
      .pipe(gulp.dest(config.dev + '/css'));
});

// Concatenate & Minify JS
gulp.task('dev:scripts', function() {
  return gulp.src('js/**/*.js')
      .pipe(concat('app.js'))
      .pipe(rename('app.min.js'))
      .pipe(gulp.dest(config.dev + '/js'));
});

// // Concatenate & Minify vendor lib
gulp.task('dev:bower', function() {
  return bower()
    .pipe(gulpFilter([
      '**/dist/jquery.js',
      '**/renderjson.js',
      '**/urijs/src/URI.js',
      '!**/*.min.js']))
    .pipe(concat('lib.js'))
    .pipe(rename('lib.min.js'))
    .pipe(gulp.dest(config.dev + '/lib'));
});

// // Concatenate & Minify vendor lib
gulp.task('dev:img', function() {
  return gulp.src('img/**')
    .pipe(image({
      pngquant: true,
      optipng: false,
      zopflipng: true,
      advpng: true,
      jpegRecompress: false,
      jpegoptim: true,
      mozjpeg: true,
      gifsicle: true,
      svgo: true
    }))
    .pipe(gulp.dest(config.dev + '/img'));
});

gulp.task('dev:minify_html', function() {
  return gulp.src('app/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(config.dev))
});

// Watch Files For Changes
gulp.task('dev:watch', function() {
  gulp.watch('js/**/*.js', ['dev:scripts']);
  gulp.watch('scss/**/*.scss', ['dev:sass']);
  gulp.watch('img/**', ['dev:img']);
  gulp.watch('app/**', ['dev:minify_html']);
  browserSync.init(config.browsersync.dev);
});


gulp.task('dev:build', function (cb) {
    runSequence([
      'dev:scripts',
      'dev:sass',
      'dev:bower',
      'dev:img',
      'dev:minify_html'], cb);
});

gulp.task('dev', function (cb) {
    runSequence('dev:build', 'dev:watch', cb);
});

gulp.task('all:clean', function(cb){
  del(delConfig.all, cb);
})

gulp.task('dev:clean', function(cb){
  del(delConfig.dev, cb);
})

gulp.task('prod:clean', function(cb){
  del(delConfig.prod, cb);
})

// TODO: prod
