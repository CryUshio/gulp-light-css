"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const through2_1 = __importDefault(require("through2"));
const gulp_util_1 = __importDefault(require("gulp-util"));
const stream_1 = __importDefault(require("stream"));
const glob_to_regexp_1 = __importDefault(require("glob-to-regexp"));
const PLUGIN_NAME = 'gulp-light-css';
const CSS_COMMENT_PREFIX = '#CSS-LIGHT ';
const CSS_IMPORT_REG = /@import\s*['"]([^'"]*)['"];/mg;
const CSS_COMMENT_REG = new RegExp(`\\/\\* ${CSS_COMMENT_PREFIX}(@import\\s*['"]([^'"]*)['"];) \\*\/`, 'mg');
function shouldIgnore(str, reg, ignoreNodeModules) {
    if (!reg) {
        return false;
    }
    if (ignoreNodeModules && isNodeModule(str)) {
        return true;
    }
    return reg.some((r) => r.test(str));
}
function isNodeModule(pathname) {
    return /^[@a-zA-Z]/.test(pathname);
}
/* 注释掉依赖引入 */
function comment(file, ignore, ignoreNodeModules) {
    file.contents = Buffer.from(String(file.contents).replace(CSS_IMPORT_REG, (substring, match) => {
        /* 是否忽略处理此依赖 */
        if (shouldIgnore(match, ignore, ignoreNodeModules)) {
            return substring;
        }
        return `/* ${CSS_COMMENT_PREFIX}${substring} */`;
    }));
}
/* 取消注释引入并修改后缀 */
function uncomment(file, ext) {
    file.contents = Buffer.from(String(file.contents).replace(CSS_COMMENT_REG, (substring, match) => {
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
function lightcss(options) {
    const _options = Object.assign({ ext: '.css', ignores: ['**/_*.*'], ignoreNodeModules: true }, options);
    const { compiler, ignores, ignoreNodeModules, ext } = _options;
    const ignoreList = ignores.map((p) => glob_to_regexp_1.default(p));
    if (!compiler) {
        new gulp_util_1.default.PluginError(PLUGIN_NAME, 'Compiler is invalid!');
    }
    return through2_1.default.obj(function (file, _, cb) {
        if (file.isNull() || shouldIgnore(file.path, ignoreList, ignoreNodeModules)) {
            return cb();
        }
        if (file.isStream()) {
            cb(new gulp_util_1.default.PluginError(PLUGIN_NAME, 'Streaming not supported.'));
            return;
        }
        comment(file, ignoreList, ignoreNodeModules);
        // console.log('comment', String(file.contents));
        const s = new stream_1.default.Readable();
        s._read = function () { };
        s.push('null');
        s.pipe(through2_1.default.obj(function () {
            this.push(file);
        }))
            .pipe(compiler)
            .pipe(through2_1.default.obj((file) => {
            uncomment(file, ext);
            cb(null, file);
        }));
    });
}
module.exports = lightcss;
