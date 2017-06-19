/**
 * Created by Kwesi Greyback on 5/4/2017.
 */
var
    assetsass = require('node-sass-asset-functions'),

    browsersync = require('browser-sync'),

    cache = require('gulp-cache'),
    cachebust = require('gulp-cache-bust'),
    cached = require('gulp-cached'),
    concat = require('gulp-concat'),

    del = require('del'),

    filesize = require('gulp-size'),

    gradientease = require('postcss-easing-gradients'),
    gulp = require('gulp'),

    htmlclean = require('gulp-htmlclean'),

    ignore = require('gulp-ignore'),
    imacss = require('gulp-imacss'),
    imagemin = require('gulp-imagemin'),
    inject = require('gulp-inject'),
    inline = require('gulp-inline'),

    nano = require('gulp-cssnano'),
    newer = require('gulp-newer'),

    pkg = require('./package.json'),
    please = require('gulp-pleeease'),
    plumber = require('gulp-plumber'),

    postcss = require('gulp-postcss'),
    preprocess = require('gulp-preprocess'),
    pug = require('gulp-pug'),
    purge = require('gulp-css-purge'),
    puglint = require('gulp-pug-lint'),

    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    sass = require('gulp-sass'),
    smacss = require('css-declaration-sorter'),
    svgo = require('gulp-svgo'),

    uglify = require('gulp-uglify'),
    uncss = require('gulp-uncss');


// Directory
var
    devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production'),
    reload = browsersync.reload,
    source = 'framework/src/',
    dest = 'framework/build/',
    scsspath = source + 'stylesheets/scss/',
    csspath = dest + 'stylesheets/css/',
    htmlpathout = dest + 'html/**/*.html',
    noampin = dest + 'html' + ['/reservations/*.html'],
    noampout = noampin.slice(0, -6),


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
        in: source + 'html/**/*.html',
        out: dest + 'html',
        watch: [source + 'html/**/*.html', source + 'templates/**/*'],
        rel: [dest + 'html/**/*'],


        processOpts: {
            context: {
                devBuild: devBuild,
                author: pkg.author,
                version: pkg.version
            }
        },

        removeUnused: {
            html: [htmlpathout],
            ignore: ['[class*="amphtml-sidebar-mask"]', 'amp-accordion section[expanded] h2 .show-more',
                'amp-accordion section:not([expanded]) h2 .show-less']
        },

        minifyOpts: {
            collapseWhitespace: true,
            removeComments: true,
            removeEmptyAttributes: true
        }

    },

    // Images
    imagedir = {
        in: source + 'assets/images/**/*',
        out: dest + 'assets/images/',

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
        //processOpts: scsspath + 'base/webfonts.scss',

        // PropertySortOrder
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
                autoprefixer: {browsers: ['last 3 versions', '> 2%']},
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
        reloadDelay: 200
    },

    // Fonts
    fontdir = {
        in: source + 'assets/fonts/**/*',
        out: dest + 'assets/fonts'
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

// #Inject
gulp.task('cssServe', ['sass'], function () {
    source = gulp.src(noampin);
    if (devBuild) {
        source
            .pipe(inject(gulp.src([csspath + 'styles.css'], {read: false}), {relative: true, removeTags: true}))
            .pipe(gulp.dest(noampout))
    } else {
        source
            .pipe(inject(gulp.src([csspath + 'styles.min.css'], {read: false}), {relative: true, removeTags: true}))
            .pipe(gulp.dest(noampout))
    }
});

//#unCSS
gulp.task('cocktail', ['sass'], function () {
    return gulp.src(csspath + '*.min.css')
        .pipe(uncss(htmldir.removeUnused))
        .pipe(gulp.dest(cssdir.out));
});

//#inline
gulp.task('inlineCSS', ['sass'], function () {
    var source = gulp.src(htmlpathout);
    if (devBuild) {
        source.pipe(inject(
            gulp.src([csspath + 'styles.css']),
            {
                name: 'styles',
                transform: function (filePath, file) {
                    return file.contents.toString('utf8')
                },
                removeTags: true
            }))
            .pipe(gulp.dest(htmldir.out))
    } else {
        source.pipe(inject(
            gulp.src([csspath + 'styles.min.css']),
            {
                name: 'styles.min',
                transform: function (filePath, file) {
                    return file.contents.toString('utf8')
                },
                removeTags: true
            }))
            .pipe(gulp.dest(htmldir.out))
    }

});


// #HTML
gulp.task('html', function () {
    var pages = gulp.src([htmldir.in]);
    pages
        .pipe(plumber())
        .pipe(preprocess(htmldir.processOpts));

    if (!devBuild) {
        pages = pages
            .pipe(filesize({title: 'HTML size in:'}))
            .pipe(htmlclean())
            .pipe(filesize({title: 'HTML size out:'}))
    }
    return pages
        .pipe(cachebust())
        .pipe(gulp.dest(htmldir.out));
});

//#CSS
gulp.task('sass', ['html'], function () {
    var files = gulp.src(cssdir.in);
    files = files
        .pipe(sass(cssdir.sassOpts))
        .pipe(postcss([gradientease()]))
        .pipe(filesize({title: 'Applying purge...'}))
        .pipe(purge())
        .pipe(filesize({title: 'File size after purge:'}))
        .pipe(filesize({title: 'Applying Automaton:'}))
        .pipe(please(cssdir.automaton.options))
        .pipe(filesize({title: 'CSS filesize after Automaton:'}))
        .pipe(filesize({title: 'CSS filesize before uncss:'}))
        .pipe(uncss(htmldir.removeUnused))
        .pipe(filesize({title: 'CSS filesize after uncss:'}));


    // rename on minify
    if (!devBuild) {
        return files
            .pipe(cached(cssdir.cachename))
            .pipe(rename(cssdir.mini))
            .pipe(filesize({title: 'Applying nano:'}))
            .pipe(nano())
            .pipe(filesize({title: 'CSS filesize after nano:'}))
            .pipe(filesize({title: 'Sorting to SMACSS:'}))
            .pipe(postcss([smacss(cssdir.sortOrder)]))
            .pipe(filesize({title: 'SMACSS applied!'}))
            .pipe(gulp.dest(cssdir.out))
    } else {
        return files
            .pipe(gulp.dest(cssdir.out))
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
gulp.task('default', ['html', 'sass', 'imagemin', 'fonts', 'browsersync', 'inlineCSS', 'cssServe'], function () {
    // HTML task + watch
    gulp.watch(htmldir.watch, ['html', 'cssServe', 'inlineCSS', reload]);


    // Font_Watch
    gulp.watch(fontdir.in, ['fonts']);

    //CSS Watch and include into html (compromise for browserSync CSS Injection
    gulp.watch(cssdir.watch, ['sass', 'html', 'inlineCSS', 'cssServe', reload]);

    // Image_Watch
    gulp.watch(imagedir.in, ['imagemin']);
});