# gulp-light-css
在编译时注释掉 css import，避免拷贝产生冗余。

css 编译器一般会将依赖拷贝进使用依赖的文件，如果有多个文件使用同一个依赖，那么这个依赖会被拷贝多次。

在编译器读取文件之前，先把原本的依赖替换掉，让编译器不拷贝该依赖。编译结束后还原依赖，使用 `@import` 来引入编译好的依赖。

# usage
```sh
npm i -D gulp-light-css
```
gulpfile.js:
```js
const less = require('gulp-less');
const lightcss = require('gulp-light-css');

function cssTask() {
  return gulp.src(['src/**/*.less'])
    .pipe(lightcss({
      compiler: less(),
      ignores: ['**/_{vars,mixin}.less'],
    }))
    .pipe(gulp.dest('dist'));
}
```

# options
### ignores
type | default |required
--|--|--
`glob[]`|`['**/*']`| `false`
用于插件忽略处理某些依赖，默认全部忽略，相当于未使用该插件。

一般忽略 vars、mixin 等文件。如果不忽略，将会产生找不到变量或mixin的错误。

e.g.
```less
@import './var.less';
@import './base.less';
div {
  color: @black;
}
```
默认情况下，使用 `ignores: ['**/*']` ，输出给编译器的文件如下：
```less
/* 依赖不会被替换，编译器不会处理忽略的依赖 */
@import './var.less';
@import './base.less';
div {
  color: @black; /* error：找不到变量 */
}
```
设置 `ignores: ['**/var.less']` 后，输出给编译器的文件：
```less
@import './var.less'; /* 插件不会处理该依赖 */
css-light0{display:block} /* 对应 @import './base.less'; */
div {
  color: @black;
}
```
设置 `ignores: []` 后，输出给编译器的文件：
```less
/* 依赖被替换，编译器不会处理该依赖 */
css-light0{display:block} /* 对应 @import './var.less'; */
css-light1{display:block} /* 对应 @import './base.less'; */
div {
  color: @black; /* error：找不到变量 */
}
```


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

### notPackIgnoreFiles
type | default |required
--|--|--
`boolean`|`false`| `false`

是否不打包 `ignores` 忽略的模块，使其仅用于编译时。默认打包。



### ext
type | default |required
--|--|--
`string`|`.css`| `false`

替换引入依赖语句的扩展名。

e.g.
```css
@import './base.less';
=>
@import './base.css';
```
