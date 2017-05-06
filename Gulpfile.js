/**
 * Created by Kwesi Greyback on 5/4/2017.
 */
var gulp = require('gulp'),
    broswersync = require('browser-sync'),
    del = require('del'),
    concat = require('gulp-concat'),
    ignore = require('gulp-ignore'),
    htmlclean = require('gulp-htmlclean'),
    imagemin = require('gulp-imagemin'),
    imacss = require('gulp-imacss'),
    newer = require('gulp-newer'),
    pkg = require('./package.json'),
    please = require('gulp-pleeease'),
    plumber = require('gulp-plumber'),
    pug = require('gulp-pug'),
    puglint = require('gulp-pug-lint'),
    preprocess = require('gulp-preprocess'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    filesize = require('gulp-size'),
    stripdebug = require('gulp-strip-debug'),
    uglify = require('gulp-uglify'),
    assetsass = require('node-sass-asset-functions');


// Directory
var
    devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production'),
    source = 'framework/src/',
    dest = 'framework/build/',



    // Pug
    jade = {
        in: source + 'jade/**/*.pug',
        out: source + 'templates',
        exclude: '!' + source + 'jade/resrcs/**/*',

        renameOpts: {
          prefix: "_"
        },


        options: {
            pretty:true
        }
    },

    htmldir = {
        in: source + 'html/**/*',
        out: dest + 'html',
        watch: [source + 'html/**/*', source + 'templates/**/*'],

        processOpts: {
            context: {
                devBuild: devBuild,
                author: pkg.author,
                version: pkg.version
            }
        }
    };


gulp.task('pug', function () {
    return gulp.src([jade.in, jade.exclude])
        .pipe(puglint())
        .pipe(newer(jade.out))
        .pipe(pug(jade.options))
        .pipe(rename(jade.renameOpts))
        .pipe(gulp.dest(jade.out));
});

gulp.task('html', function () {
    return gulp.src(htmldir.in)
        .pipe(preprocess(htmldir.processOpts))
        .pipe(gulp.dest(htmldir.out));
});