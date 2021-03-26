import through from 'through2';
import gutil from 'gulp-util';
import stream from 'stream';
import globToReg from 'glob-to-regexp';

const PLUGIN_NAME = 'gulp-light-css';
const CSS_COMMENT_PREFIX = '#CSS-LIGHT ';
const CSS_IMPORT_REG = /@import\s*['"]([^'"]*)['"];/mg;
const CSS_COMMENT_REG = new RegExp(`\\/\\* ${CSS_COMMENT_PREFIX}(@import\\s*['"]([^'"]*)['"];) \\*\/`, 'mg');

type Options = {
  ignores?: string[]; /* 忽略的依赖文件名 glob；如 变量、mixin 文件 */
  compiler: NodeJS.ReadWriteStream | NodeJS.WriteStream;
  ignoreNodeModules?: boolean; /* 忽略 node_modules 模块，默认 true */
  ext?: string /* 替换后缀 */;
};

function shouldIgnore(str: string, reg?: RegExp[], ignoreNodeModules?: boolean) {
  if (!reg) {
    return false;
  }
  if (ignoreNodeModules && isNodeModule(str)) {
    return true;
  }
  return reg.some((r) => r.test(str));
}

function isNodeModule(pathname: string) {
  return /^[@a-zA-Z]/.test(pathname);
}

/* 注释掉依赖引入 */
function comment(file: any, ignore?: RegExp[], ignoreNodeModules?: boolean) {
  file.contents = Buffer.from(
    String(file.contents).replace(CSS_IMPORT_REG, (substring, match) => {
      /* 是否忽略处理此依赖 */
      if (shouldIgnore(match, ignore, ignoreNodeModules)) {
        return substring;
      }
      return `/* ${CSS_COMMENT_PREFIX}${substring} */`;
    })
  );
}

/* 取消注释引入并修改后缀 */
function uncomment(file: any, ext: string) {
  file.contents = Buffer.from(
    String(file.contents).replace(CSS_COMMENT_REG, (substring, match) => {
      /* 替换后缀 */
      return String(match).replace(/(\.[a-zA-Z0-9]+)(?=['"])/, ext);
    }));
}

/**
 * 
 * @param options
 *
 *  @property {glob[]} ignores? 忽略的依赖文件，默认忽略前缀为"_"的文件
 *  @property {Stream} compiler `eg. require('gulp-less')()`
 *  @property {boolean} ignoreNodeModules? 忽略 node_modules 模块，默认 true 
 *  @property {string} ext? 替换依赖后缀. `default: .css`. `eg. @import './foo.less' -> @import './foo.css'`
 *
 */
function lightcss(options: Options) {
  const _options: Required<Options> = {
    ext: '.css',
    ignores: ['**/_*.*'],
    ignoreNodeModules: true,
    ...options,
  };

  const { compiler, ignores, ignoreNodeModules, ext } = _options;
  const ignoreList = ignores.map((p) => globToReg(p));

  if (!compiler) {
    new gutil.PluginError(PLUGIN_NAME, 'Compiler is invalid!');
  }

  return through.obj(function (file, _, cb) {
    if (file.isNull() || shouldIgnore(file.path, ignoreList, ignoreNodeModules)) {
      return cb();
    }
    if (file.isStream()) {
      cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported.'));
      return;
    }

    comment(file, ignoreList, ignoreNodeModules);
    // console.log('comment', String(file.contents));

    const s = new stream.Readable();
    s._read = function () {};
    s.push('null');
    s.pipe(
      through.obj(function () {
        this.push(file);
      })
    )
      .pipe(compiler)
      .pipe(
        through.obj((file) => {
          uncomment(file, ext);
          cb(null, file);
        })
      );
  });
}

export = lightcss;
