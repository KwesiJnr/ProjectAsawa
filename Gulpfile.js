/**
 * Created by Kwesi Greyback on 5/4/2017.
 */
var
    assetsass = require('node-sass-asset-functions'),
    gulp = require('gulp'),
    browsersync = require('browser-sync'),
    cache = require('gulp-cache'),
    cached = require('gulp-cached'),
    cachebust = require('gulp-cache-bust'),
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
    postcss = require('gulp-postcss'),
    pug = require('gulp-pug'),
    puglint = require('gulp-pug-lint'),
    preprocess = require('gulp-preprocess'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    smacss = require('css-declaration-sorter'),
    svgo = require('gulp-svgo'),
    stripcomments = require('gulp-strip-css-comments'),
    filesize = require('gulp-size'),
    uglify = require('gulp-uglify');



// Directory
var
    devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production'),
    reload = browsersync.reload,
    source = 'framework/src/',
    dest = 'framework/build/',
    scsspath = source + 'stylesheets/scss/',
    csspath = dest + 'stylesheets/css',


    // Pug
    jade = {
        in: source + 'jade/**/*.pug',
        out: source + 'templates',
        exclude: '!' + source + 'jade/resrcs/**/*',

        renameOpts: {
            prefix: "_"
        },


        options: {
            pretty: true
        }
    },

    // HTML
    htmldir = {
        in: source + 'html/**/*',
        out: dest + 'html',
        watch: [source + 'html/**/*', source + 'templates/**/*'],
        rel: [dest + 'html/**/*'],

        processOpts: {
            context: {
                devBuild: devBuild,
                author: pkg.author,
                version: pkg.version
            }
        }
    },

    // Images
    imagedir = {
        in: source + 'assets/images/**/*',
        out: dest + 'assets/images',

        imgOpts: {
            cache: false
        }
    },

    // CSS
    cssdir = {
        in: scsspath + '*.scss',
        out: csspath,
        watch: [scsspath + '**/*'],
        mini: {suffix: '.min'},
        cachename: 'sass-cache',

        sortOrder: {
            order: 'smacss',
            verbose: true
        },

        // Pleeease
        sassOpts: {
            outputStyle: 'expanded',
            precision: 3,
            errLogToConsole: true,

            functions: assetsass({
                http_images_path: '../../assets/images',
                http_fonts_path: '../../assets/fonts/'
            })
        },

        // Automaton
        automaton: {
            minDir: csspath + 'min',

            options: {
                autoprefixer: {browsers: ['last 2 versions', '> 2%']},
                rem: ['16px'],
                pseudoElements: true,
                mqpacker: true,
                minifier: !devBuild
            },

            rename: {
                extname: '.css'
            }
        }
    },

    // BrowserSync
    bsOpts = {
        server: {
            baseDir: [dest, dest + 'html'],
            index: 'index.html'
        },
        open: false,
        notify: true,
        //tunnel: 'gulp',
        browser: 'chrome',
        reloadDelay: 500,
        online: false
    },

    // Fonts
    fontdir = {
        in: source + 'assets/fonts/**/*',
        out: dest + 'assets/fonts',

        genOpts: {
            in: source + 'assets/fonts/**/*.{ttf,otf}'
        }
    };


// Show Deployment Build Number
console.log(pkg.name + ' ' + pkg.version + ', ' + (devBuild ? 'development' : 'production') + ' build');

// #Pug
gulp.task('pug', function () {
    return gulp.src([jade.in, jade.exclude])
        .pipe(puglint())
        .pipe(newer(jade.out))
        .pipe(pug(jade.options))
        .pipe(rename(jade.renameOpts))
        .pipe(gulp.dest(jade.out));
});


// #HTML
gulp.task('html', ['sass'], function () {
    var pages = gulp.src(htmldir.in)
        .pipe(preprocess(htmldir.processOpts));

    if (!devBuild) {
        pages = pages
            .pipe(filesize({title: 'HTML size in:'}))
            .pipe(htmlclean())
            .pipe(filesize({title: 'HTML size out:'}));
    }
    return pages
        .pipe(cachebust())
        .pipe(stripcomments())
        .pipe(gulp.dest(htmldir.out));
});

//#CSS
gulp.task('sass', function () {
    var files = gulp.src(cssdir.in);
    files = files
        .pipe(sass(cssdir.sassOpts))
        .pipe(filesize({title: 'CSS file-size before optimization by pleeeaase:'}))
        .pipe(please(cssdir.automaton.options))
        .pipe(filesize({title: 'CSS file-size after optimization by pleeease:'}));

    // rename on minify
    if (!devBuild) {
        return files
            .pipe(cached(cssdir.cachename))
            .pipe(rename(cssdir.mini))
            .pipe(postcss([smacss(cssdir.sortOrder)]))
            .pipe(gulp.dest(cssdir.out))
            .pipe(browsersync.stream())
    } else {
        return files
            .pipe(gulp.dest(cssdir.out))
            .pipe(browsersync.stream())

    }
});

// #BrowserSync
gulp.task('browsersync', function () {
    browsersync(bsOpts);
});


// #Fonts
gulp.task('fonts', function () {
    return gulp.src(fontdir.in)
        .pipe(newer(fontdir.out))
        .pipe(gulp.dest(fontdir.out))
});

// #Image Optimizer
gulp.task('imagemin', function () {
    var images = gulp.src(imagedir.in);
    return images
        .pipe(newer(imagedir.out))
        .pipe(imagemin(imagedir.imgOpts))
        .pipe(svgo())
        .pipe(gulp.dest(imagedir.out));
});

// Directory Cleaner
gulp.task('clear', function (done) {
    return cache.clearAll(done);
});

gulp.task('clean', ['clear'], function () {
    del([
        dest + '*'
    ]);
});


// ==========================================================================
// #Default Tasks
// ==========================================================================
gulp.task('default', ['html', 'sass', 'imagemin', 'fonts', 'browsersync'], function () {
    // HTML task + watch
    gulp.watch(htmldir.watch, ['html', reload]);

    // Font_Watch
    gulp.watch(fontdir.in, ['fonts']);

    //CSS Watch and include into html (compromise for browserSync CSS Injection
    gulp.watch(cssdir.watch, ['sass', 'html', reload]);

    // Image_Watch
    gulp.watch(imagedir.in, ['imagemin']);
});