// general
const gulp = require('gulp');
const del = require('del');
const gulpif = require('gulp-if');
const rename = require('gulp-rename');
const rev = require('gulp-rev');
const fs = require('fs-extra');
const exec = require('child_process').execSync;
const nconf = require('@console/console-platform-nconf');
const argv = require('yargs').argv;
nconf.file('./config/app.json');

// sass
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');

// images
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');

// javascript
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');

// sourcemaps
const sourcemaps = require('gulp-sourcemaps');

// i18n
const i18nParser = require('i18next-parser');
const jsonEditor = require('gulp-json-editor');
const i18nFiles = [
  `${__dirname}/src/client/*(utils|view|api)/**/*.*`,
  `${__dirname}/src/server/**/*.*`,
];

// browserSync
const browserSync = require('browser-sync').create();
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const bundler = webpack(webpackConfig);
const proxy = require('proxy-middleware');
const url = require('url');

// environment flags
const env = argv.env === 'prod' ? 'prod' : 'dev';

const license = require('gulp-header-license');
const year = new Date().getFullYear();

// callback function for exiting the build script
function exitOnError() {
  process.exit(1);
}

// ////////////////////////////////////////////////
// Variables
// ////////////////////////////////////////////////

const sourceDir = 'src/client';
const destDir = 'dist/server/ts/public';

const autoprefixerConfig = {
  cascade: true,
  remove: true,
};

// ////////////////////////////////////////////////
// Base Tasks
// ////////////////////////////////////////////////

gulp.task('copyright', cb => {
  // gulp
  //   .src(['app.js', '{lib,routes}/**/*.{js,svg,jsx,scss,dust}'])
  //   .pipe(license(fs.readFileSync('copyright.txt', 'utf8'), { year }, 0.9))
  //   .pipe(gulp.dest(''));
  cb();
});

// ////////////////////////////////////////////////
// Task Details
// ////////////////////////////////////////////////

gulp.task('clean', del.bind(null, [destDir]));

gulp.task('styles', () => {
  const files = [
    `${sourceDir}/scss/app.scss`,
  ];
  const sassOptions = {
    outputStyle: (env === 'dev') ? 'nested' : 'compressed',
    includePaths: ['./node_modules'],
  };
  return gulp.src(files)
    .on('error', exitOnError)
    .pipe(gulpif(env === 'dev', sourcemaps.init()))
    .pipe(sass(sassOptions).on('error', sass.logError).on('error', exitOnError))
    .pipe(autoprefixer(autoprefixerConfig))
    .pipe(gulpif(env === 'dev', sourcemaps.write()))
    .pipe(gulpif(env === 'prod', license(fs.readFileSync('copyright.txt', 'utf8'), { year }, 0.9)))
    .pipe(gulpif(env === 'prod', rev()))
    .pipe(gulp.dest(`${destDir}/css`))
    .pipe(gulpif(env === 'dev', browserSync.stream()));
});

gulp.task('scripts', cb => {
  webpack([webpackConfig], (err, stats) => {
    if (err) throw err;
    console.log('[webpack]', stats.toString({
      chunks: false,
      colors: true,
    }));
    cb();
  });
});

gulp.task('images', () => {
  const files = `${sourceDir}/img/**/*.*`;
  return gulp.src(files)
    .pipe(newer(`${destDir}/img`))
    .pipe(imagemin())
    .pipe(rev())
    .pipe(gulp.dest(`${destDir}/img`));
});

gulp.task('libs', () => {
  const files = [
    `${__dirname}/node_modules/jquery/dist/jquery.min.js`,
  ];

  return gulp.src(files)
    .pipe(rename((path, file) => {
      const pkg = fs.readJsonSync(file.path.replace(/(\/node_modules\/[^\/]+\/).*/, '$1package.json'));
      path.basename = `${pkg.name}-${pkg.version}`;
    }))
    .pipe(gulp.dest(`${destDir}/lib`));
});

gulp.task('build', gulp.series('clean', 'libs', gulp.parallel('styles', 'scripts', 'images')));

gulp.task('serve_only', () => {
  browserSync.init({
    startPath: `${nconf.get('proxyRoot')}`,
    server: {
      baseDir: `${destDir}`,
      middleware: [
        // Watch for any changes to javascript / react source files and compile
        // and hot reload them on the fly.
        webpackDevMiddleware(bundler, {
          publicPath: webpackConfig.output.publicPath,
          stats: { colors: true },
          noInfo: true,
        }),
        webpackHotMiddleware(bundler),
        // Proxy all requests to the reverse-proxy
        proxy(url.parse('http://localhost:3000')),
      ],
    },
  });
  // Recompile and hot reload styles when they change
  gulp.watch(`${sourceDir}/scss/**/*.scss`, gulp.task('styles'));
  // Process any changes to images
  gulp.watch(`${sourceDir}/img/**/*.*`, gulp.task('images'));
});

gulp.task('serve', gulp.series('build', 'serve_only'));

gulp.task('deploy', gulp.series('copyright', 'build'));

const locales = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'pt-br', 'zh-cn', 'zh-tw'];
gulp.task('i18n:prepare-bundles', () => {
  return gulp.src(i18nFiles)
    // Run each file through the i18n parser to extract the strings and write them into
    // new locale bundles.
    .pipe(i18nParser({
      locales,
      writeOld: false,
      keepRemoved: false,
      namespace: 'functions',
      suffix: '-resources',
      output: `${__dirname}/locales/tmp`,
      // We don't use namespace or key separators, so set these to some strings that won't exist
      namespaceSeparator: '_xxx_',
      keySeparator: '_zzz_',
    }))
    // Remove the namespace required for the server side strings and sort the keys
    .pipe(jsonEditor(jsonObject => {
      const sortedBundle = {};
      Object.keys(jsonObject).sort((a, b) => a.localeCompare(b)).forEach(key => {
        sortedBundle[key] = jsonObject[key];
      });
      return sortedBundle;
    }))
    // Write the updated string bundle back to the tmp folder
    .pipe(gulp.dest(`${__dirname}/locales/tmp`));
});
gulp.task('i18n:write-bundles', cb => {
  const path = `${__dirname}/locales`;
  locales.forEach(locale => {
    const newBundle = fs.readJsonSync(`${path}/tmp/${locale}/coligo-resources.json`);
    if (fs.existsSync(`${path}/${locale}/coligo-resources.json`)) {
      const oldBundle = fs.readJsonSync(`${path}/${locale}/coligo-resources.json`);
      Object.keys(newBundle).forEach(key => {
        if (oldBundle[key]) newBundle[key] = oldBundle[key];
        else if (!newBundle[key]) newBundle[key] = key;
      });
      fs.writeJsonSync(`${path}/${locale}/coligo-resources.json`, newBundle, { spaces: 2 });
    } else {
      fs.createFileSync(`${path}/${locale}/coligo-resources.json`);
      fs.writeJsonSync(`${path}/${locale}/coligo-resources.json`, newBundle, { spaces: 2 });
    }
  });
  del(`${path}/tmp`);
  cb();
});
gulp.task('i18n', gulp.series('i18n:prepare-bundles', 'i18n:write-bundles'));

gulp.task('opensource', cb => {
  const deps = fs.readJsonSync(`${__dirname}/package-lock.json`).dependencies;
  const packages = {};
  const getSource = info => (info.repository && info.repository.url || info.homepage || '')
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://');
  const addPackage = (name, file) => {
    if (name in packages || name.startsWith('@console')) return;
    const info = fs.readJsonSync(file);
    const version = info.version;
    const source = getSource(info);
    packages[name] = source ? `${name} ${version} - ${source}` : `${name} ${version}`;
  };
  Object.keys(deps)
    .forEach(name => addPackage(name, `${__dirname}/node_modules/${name}/package.json`));
  const sortedPackages = Object.keys(packages).sort().map(name => packages[name]).join('\n');
  fs.writeFileSync(`${__dirname}/OPENSOURCE.txt`, sortedPackages);
  exec(`mv ${__dirname}/OPENSOURCE.txt ${__dirname}/OPENSOURCE`);
  cb();
});
