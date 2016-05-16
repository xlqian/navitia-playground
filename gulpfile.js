// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass   = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var htmlmin = require('gulp-htmlmin');
var bower = require('gulp-bower-src');
var image = require('gulp-image');
var gulpFilter = require('gulp-filter');
var gulpif = require('gulp-if')
var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var del    = require('del');
var config = require('./config');
var delConfig = config.del;

function isProd(env) {
  return env == 'prod';
}
// Lint Task
gulp.task('lint', function() {
  return gulp.src('js/*.js')
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
});

// Compile Sass
function compile_sass(env) {
  return function() {
    return gulp.src('scss/**/*.scss')
      .pipe(sass())
      .pipe(gulpFilter('**/style.css'))
      .pipe(gulpif(isProd(env), cleanCSS()))
      .pipe(gulp.dest(config[env] + '/css'));
  }
}
gulp.task('dev:sass', compile_sass('dev'));
gulp.task('prod:sass', compile_sass('prod'));

// Concatenate & Minify JS
function compile_js(env) {
  return function () {
    return gulp.src('js/**/*.js')
        .pipe(concat('app.js'))
        .pipe(gulpif(isProd(env), uglify()))
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest(config[env] + '/js'));
  }
}
gulp.task('dev:scripts', compile_js('dev'));
gulp.task('prod:scripts', compile_js('prod'));

// Concatenate & Minify vendor lib
function compile_vendor(env){
  return function(){
    return bower()
      .pipe(gulpFilter([
        '**/dist/jquery.js',
        '**/renderjson.js',
        '**/urijs/src/URI.js',
        '!**/*.min.js']))
      .pipe(concat('lib.js'))
      .pipe(gulpif(isProd(env),uglify()))
      .pipe(rename('lib.min.js'))
      .pipe(gulp.dest(config[env] + '/lib'));
  }
}
gulp.task('dev:bower', compile_vendor('dev'));
gulp.task('prod:bower', compile_vendor('prod'));

// Compress img
function compress_img(env) {
  return function(){
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
      .pipe(gulp.dest(config[env] + '/img'));
  }
}
gulp.task('dev:img', compress_img('dev'));
gulp.task('prod:img', compress_img('prod'));

// Minify html
function compile_html(env){
  return function() {
    return gulp.src('app/*.html')
      .pipe(htmlmin({collapseWhitespace: isProd(env)}))
      .pipe(gulp.dest(config[env]))
  }
}
gulp.task('dev:minify_html', compile_html('dev'));
gulp.task('prod:minify_html', compile_html('prod'));

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('js/**/*.js', ['dev:scripts']);
  gulp.watch('scss/**/*.scss', ['dev:sass']);
  gulp.watch('img/**', ['dev:img']);
  gulp.watch('app/**', ['dev:minify_html']);
  browserSync.init(config.browsersync.dev);
});

function build(env) {
  return function(cb){
      runSequence([
        env + ':scripts',
        env + ':sass',
        env + ':bower',
        env + ':img',
        env + ':minify_html'], cb);
  }
}

gulp.task('dev:build', build('dev'));

gulp.task('dev', function (cb) {
    runSequence('dev:build', 'watch', cb);
});

gulp.task('prod:build', build('prod'));

gulp.task('prod', function (cb) {
    runSequence('prod:build', 'watch', cb);
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
