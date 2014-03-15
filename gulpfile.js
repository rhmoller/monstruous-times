var gulp = require('gulp');

var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var connect = require('connect');
var http = require('http');


gulp.task('lint', function() {
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('concat', function() {
    return gulp.src(['src/**/*.js'])
        .pipe(concat('game-all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('game-all-min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'))
});

gulp.task('resources', function() {
    return gulp.src(['index.html', 'gfx/*'])
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.js', ['lint', 'concat']);
    gulp.watch(['index.html', 'gfx/*'], ['resources']);
});

gulp.task('server', ['watch'], function() {
    var srv = connect()
        .use(connect.static('dist'));

    http.createServer(srv).listen(9000);
});


gulp.task('default', ['lint', 'concat', 'resources', 'server']);
