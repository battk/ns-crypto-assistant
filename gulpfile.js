var gulp = require('gulp');
var gulpIf = require('gulp-if');
var prettier = require('gulp-prettier');
var eslint = require('gulp-eslint');
var gulpIgnore = require('gulp-ignore');
var sdfcliTasks = require('./tasks/sdfcli-tasks');
var deploy = sdfcliTasks.deploy;

// define module is questionable. order its loaded in matters
require('define');
var gulpMocha = require('gulp-mocha');

// don't include the '.' in front. Minimatch does not
// understand dots as relative
var projectLocation = 'FileCabinet/SuiteScripts/ns-crypto-assistant/';
var entryPointLocation = projectLocation + '*.js';
var srcLocations = [
	'*.js',
	'tasks/*.js',
	projectLocation + 'src/*.js',
	projectLocation + 'lib/*.js',
	projectLocation + 'spec/**/*.js',
	entryPointLocation,
];
var configLocations = ['*.json'];

// TODO more complicated bundle step where srcs are bundled together
function bundleSimple() {
	return gulp.src([require.resolve('qs/dist/qs')]).pipe(
		gulp.dest(function (file) {
			return projectLocation + 'vendor/' + file.stem;
		})
	);
}

function dev() {
	return (
		gulp
			.src(srcLocations, { base: './', since: gulp.lastRun(dev) })
			.pipe(prettier())
			.pipe(
				gulpIf(function (file) {
					return file.isPrettier;
				}, gulp.dest('./'))
			)
			.pipe(eslint())
			.pipe(eslint.format())
			.pipe(eslint.failAfterError())
			// Exclude entrypoints to avoid N/* module missing errors
			.pipe(gulpIgnore.exclude(entryPointLocation))
			.pipe(gulpMocha())
	);
}

function devw() {
	return (
		gulp
			.src(srcLocations, { base: './', since: gulp.lastRun(dev) })
			.pipe(eslint())
			.pipe(eslint.format())
			.pipe(eslint.failAfterError())
			// Exclude entrypoints to avoid N/* module missing errors
			.pipe(gulpIgnore.exclude(entryPointLocation))
			.pipe(gulpMocha())
	);
}

function watch() {
	gulp.watch(
		srcLocations.concat(configLocations),
		{ ignoreInitial: false },
		gulp.series(devw, bundleSimple, deploy)
	);
}

module.exports.dev = dev;
module.exports.watch = watch;
module.exports['default'] = gulp.series(dev, bundleSimple, deploy);
module.exports.deploy = deploy;
module.exports['import'] = sdfcliTasks['import'];
module.exports.authenticate = sdfcliTasks.authenticate;
