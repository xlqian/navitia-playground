var src               = 'app';
var build             = 'dist';
var dev               = build + '/dev';
var prod              = build + '/prod';


module.exports = {
  dev: dev,
  prod: prod,
  browsersync: {
    dev: {
      server: {
        baseDir: [dev, build, src]
      },
      port: 4242,
      files: [
        dev + '/*.html',
        dev + '/css/*.css',
        dev + '/js/*.js',
        dev + '/img/**',
        dev + '/fonts/*'
      ]
    },
    prod: {
      server: {
        baseDir: [prod, build, src]
      },
      port: 80,
      files: [
        prod + '/css/*.css',
        prod + '/js/*.js',
        prod + '/img/**',
        prod + '/fonts/*'
      ]
    }
  },
  del : {
    all: [build],
    dev: [dev],
    prod: [prod]
  }
};
