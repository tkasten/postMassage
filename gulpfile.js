const gulp = require('gulp');
const mocha = require('gulp-mocha');

gulp.task('test', function(){
  return gulp.src('**/*-spec.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});
