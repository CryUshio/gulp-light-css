# gulp-light-css
在编译时注释掉 css import，避免拷贝产生冗余。

# usage
```
npm i -D gulp-light-css
```
gulpfile.js:
```js
const less = require('gulp-less');
const lightcss = require('gulp-light-css');

function cssTask() {
  return gulp.src(['src/**/*.less'])
    .pipe(lightcss({
      compiler: less()
    }))
    .pipe(gulp.dest('dist'));
}
```

# options
### ignores
type | default |required
--|--|--
`glob[]`|`['**/_*.*']`| `false`
用于忽略依赖，如变量、mixin文件。如果不忽略，将会产生找不到变量或mixin的错误。

### compiler
type | default |required
--|--|--
`Stream`|`null`| `true`

样式文件使用的编译器。

### ignoreNodeModules
type | default |required
--|--|--
`boolean`|`true`| `false`

是否忽略 `node_modules` 模块，默认忽略，让编译器去拷贝打包。


### ext
type | default |required
--|--|--
`string`|`.css`| `false`

替换引入依赖语句的扩展名。

eg.
```css
@import './base.less';
=>
@import './base.css';
```
