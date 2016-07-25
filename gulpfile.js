// ==============================================
// require
// ==============================================
const gulp = require('gulp');
const babel = require('gulp-babel');
const browserSync = require('browser-sync');
const concat = require('gulp-concat');
const ejs = require('gulp-ejs');
const filter = require('gulp-filter');
const header = require('gulp-header');
const pleeease = require('gulp-pleeease');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const shell = require('gulp-shell');
const sourcemaps = require('gulp-sourcemaps');
const watch = require('gulp-watch');
const spritesmith = require('gulp.spritesmith');
const bower = require('main-bower-files');
const pkg = require('./package.json');

// ==============================================
// variable
// ==============================================
const paths = {
	css: 'source/common/css',
	sass: 'sass',
	image: 'source/common/images',
	js: {
		concat: 'source/common/js/concat',
		dest: 'source/common/js',
		bower: 'bower_components'
	},
	ejs: 'templates'
}
const options = {
	libsass: {
		outputStyle: 'expanded'
	},
	pleeease: {
		mqpacker: true,
		minifier: true,
		sourcemaps: false,
		autoprefixer: { 'browsers': ['last 3 versions', 'ie 8', 'ios 7'] }
	}
}

// ==============================================
// default + tasklist
// ==============================================
gulp.task('default', ['browser-sync', 'watch']);
gulp.task('serve', ['browser-sync', 'watch']);
gulp.task('build', ['js', 'sprite', 'font', 'css']);
gulp.task('css', ['ple']);
gulp.task('js', ['js']);
gulp.task('sprite', ['sprite']);
gulp.task('vorlon', ['vorlon']);

// ==============================================
// JS
// ==============================================
gulp.task('BowerJS', () => {
	var jsFilter = filter('**/*.js');
	return gulp.src(bower())
						.pipe(jsFilter)
						.pipe(concat('lib.js'))
						.pipe(gulp.dest('source/common/js/'));
});

gulp.task('js', () => {
	var libJS = `${paths.js.bower}/lib.js`;
	var commonJS = `${paths.js.concat}/common.js`;
	var createFile = {
		concat: 'import.js',
		common: 'common.es5.js',
		path: `${paths.js.concat}`
	};
	var destPath = paths.js.dest;

	return runningJS(libJS, commonJS, createFile, destPath);
});

function runningJS(_libJS, _commonJS, _createFilename, _destPath){
	var date = new Date();
	var banner = `/*!\n * <%= pkg.name %>\n * @generated ${date}\n */`;
	var array = _arrayJSPath;
	array.push(`${_createFilename.path}/${_createFilename.common}`);

	// common.jsをES6からES5へ変換
	var commonStream = gulp.src(_commonJS)
	.pipe(plumber())
	.pipe(babel({
		presets: ['es2015']
	}))
	.pipe(concat(_createFilename.common))
	.pipe(gulp.dest(_createFilename.path));

	// 変換したcommon.jsを追加したimport.js生成
	var importStream = gulp.src(array)
	.pipe(plumber())
	.pipe(concat(_createFilename.concat))
	.pipe(header(banner, { pkg:pkg }))
	.pipe(sourcemaps.init())
		.pipe(uglify({ preserveComments: 'some' }))
	.pipe(sourcemaps.write('./'))
	.pipe(gulp.dest(_destPath))
	.pipe(browserSync.reload({ stream: true }));

	return merge(commonStream, importStream);
}

// ==============================================
// ejs
// ==============================================
gulp.task('ejs', () => {
	var _ejsPass = paths.ejs;
	gulp.src([_ejsPass+'/**/*.ejs','!'+_ejsPass+'/**/_*.ejs'])
		.pipe(plumber())
		.pipe(ejs({}, {ext: '.html'}))
		.pipe(gulp.dest('./source'));
});

// ==============================================
// sass
// ==============================================
gulp.task('sass', () => {
	var pathSass = paths.sass;
	var css = paths.css;
	return runningSass(pathSass, options.libsass, css);
});
function runningSass(_sassPath, _sassOptions, _destPath){
	return gulp.src(_sassPath+'/**/*.scss')
	.pipe(plumber())
	.pipe(sass(_sassOptions))
	.pipe(gulp.dest(_destPath))
	.pipe(browserSync.reload({ stream: true }));
}
gulp.task('ple', ['sass'], () => {
	var css = paths.css;
	return runningPleeeaseNano(css, options.pleeease, css);
});
function runningPleeeaseNano(_cssPath, _plzOptions, _destPath){
	return gulp.src(`${_cssPath}/*.css`)
	.pipe(pleeease(_plzOptions))
	.pipe(gulp.dest(_destPath));
}

// ==============================================
// spritesmith
// ==============================================
gulp.task('sprite', () => {
	var templatePath = 'sass/template/spritesmith_tmp.txt';
	var destIncludePath = 'sass/include/';

	return runningSprite(paths.common.image, templatePath, destIncludePath);
});
function runningSprite(_srcPath, _cssTemplate, _destIncludePath){
	var spriteData = gulp.src(`${_srcPath}/sprites/*.png`)
		.pipe(spritesmith({
			imgName: 'sprites.png',
			cssName: '_sprite.scss',
			imgPath: `/${_srcPath}/sprites.png`,
			cssTemplate: _cssTemplate,
			algorithm: 'binary-tree',
			algorithmOpts: { sort: true },
			cssOpts: { functions: true },
			padding: 20,
		}));
	var imgStream = spriteData.img.pipe(gulp.dest(`${_srcPath}/`));
	var cssStream = spriteData.css.pipe(gulp.dest(_destIncludePath));

	return merge(imgStream, cssStream);
}

// ==============================================
// browser-sync
// ==============================================
gulp.task('vorlon', shell.task(['vorlon']));
gulp.task('browser-sync', () => {
	browserSync.init({
		port: 9910,
		proxy: 'test.portfolio.jp',
		watchTask: true,
		notify: false,
		ghostMode: false,
		watchOptions: {
			ignoreInitial: true,
			ignored: './node_modules/'
		}
	});
});
gulp.task('reload', () => browserSync.reload());

// ==============================================
// watch
// ==============================================
gulp.task('watch', function () {
	watch(`${paths.sass}/*.scss`, () => gulp.start('sass'));
	watch(`${paths.sass}/include/*.scss`, () => gulp.start('sass'));
	watch(`${paths.image}/sprites/*.png`, () => gulp.start('sprite'));
	watch(`${paths.js.concat}/*.js`, () => gulp.start('js'));
	watch('./**/*.ejs', () => gulp.start('ejs'));

	gulp.watch([
		'./**/*.html',
	], ['reload']);
});
// ==============================================
