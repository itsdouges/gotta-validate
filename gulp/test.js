var gulp = require('gulp'),
	jasmine = require('gulp-jasmine'),
	config = require('./config.json'),
	cover = require('gulp-coverage');

/**
 * Run test once and exit
 */
gulp.task('test', function () {
	return gulp.src([
			__dirname + config.src + '/**/*.spec.js'
		])
		.pipe(cover.instrument({
			pattern: ['**/*.spec.js']
		}))
		.pipe(jasmine({
			includeStackTrace: true
		}))
		.pipe(cover.gather())
		.pipe(cover.format({
			reporter: 'json',
			outFile: 'lcov.info'
		}))
		.pipe(gulp.dest('.tmp'));
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('test:auto', ['test'], function () {
	console.log('Watching js files..');

    return gulp.watch(__dirname + config.src + '/**/*.js', ['test']);
});