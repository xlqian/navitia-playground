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
        .pipe(concat('app.min.js'))
        .pipe(gulpif(isProd(env), uglify()))
        .pipe(gulp.dest(config[env] + '/js'));
    }
}
gulp.task('dev:scripts', compile_js('dev'));
gulp.task('prod:scripts', compile_js('prod'));

// Concatenate & Minify vendor js
function compile_vendor_js(env){
    return function(){
        return bower()
        .pipe(gulpFilter([
            '**/dist/jquery.js',
            '**/jquery-ui.js',
            '**/renderjson.js',
            '**/urijs/src/URI.js',
            '**/jqueryui-timepicker-addon/dist/jquery-ui-timepicker-addon.js',
            '!**/*.min.js']))
            .pipe(concat('lib.min.js'))
            .pipe(gulpif(isProd(env),uglify()))
            .pipe(gulp.dest(config[env] + '/lib'));
    }
}
gulp.task('dev:bowerJs', compile_vendor_js('dev'));
gulp.task('prod:bowerJs', compile_vendor_js('prod'));

// Concatenate & Minify vendor css
function compile_vendor_css(env){
    return function(){
        return bower()
        .pipe(gulpFilter([
            '**/jquery-ui/themes/smoothness/jquery-ui.css',
            '**/jqueryui-timepicker-addon/dist/jquery-ui-timepicker-addon.css']))
            .pipe(concat('vendor.min.css'))
            .pipe(gulpif(isProd(env),cleanCSS()))
            .pipe(gulp.dest(config[env] + '/css'));
    }
}
gulp.task('dev:bowerCss', compile_vendor_css('dev'));
gulp.task('prod:bowerCss', compile_vendor_css('prod'));


gulp.task('dev:bower', function(cb){
    runSequence(['dev:bowerJs', 'dev:bowerCss'], cb);
});

gulp.task('prod:bower', function(cb){
    runSequence(['prod:bowerJs', 'prod:bowerCss'], cb);
});

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
function watch(env){
    return function() {
        gulp.watch('js/**/*.js', [env + ':scripts']);
        gulp.watch('scss/**/*.scss', [env + ':sass']);
        gulp.watch('img/**', [env + ':img']);
        gulp.watch('app/**', [env + ':minify_html']);
        browserSync.init(config.browsersync[env]);
    }
}
gulp.task('dev:watch', watch('dev'));
gulp.task('prod:watch', watch('prod'));

// build sequence
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
gulp.task('prod:build', build('prod'));

gulp.task('dev', function (cb) {
    runSequence('dev:build', 'dev:watch', cb);
});
gulp.task('prod', function (cb) {
    runSequence('prod:build', 'prod:watch', cb);
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
