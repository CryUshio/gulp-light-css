"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const through2_1 = __importDefault(require("through2"));
const gulp_util_1 = __importDefault(require("gulp-util"));
const stream_1 = __importDefault(require("stream"));
const glob_to_regexp_1 = __importDefault(require("glob-to-regexp"));
const PLUGIN_NAME = 'gulp-light-css';
const CSS_IMPORT_REG = /@import\s*['"]([^'"]*)['"];/gm;
const CSS_COMMENT = (index) => `css-light${index}{display:block}`;
const CSS_COMMENT_REG = /css-light(\d+)[\s\r\n]*\{[\s\r\n]*display\s*:\s*block;?[\s\r\n]*\}/gm;
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
    const _options = Object.assign({ ext: '', ignores: ['**/_*.*'], ignoreNodeModules: true }, options);
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
        /* 如果用注释的方式，可能会被其他插件删除 */
        const importMap = [];
        /* 删除掉依赖引入 */
        function save(file, ignore, ignoreNodeModules) {
            file.contents = Buffer.from(String(file.contents).replace(CSS_IMPORT_REG, (substring, match) => {
                /* 是否忽略处理此依赖 */
                if (shouldIgnore(match, ignore, ignoreNodeModules)) {
                    return substring;
                }
                const i = importMap.push(substring) - 1;
                return CSS_COMMENT(i);
            }));
        }
        /* 重新插入依赖并修改后缀 */
        function restore(file, ext) {
            file.contents = Buffer.from(String(file.contents).replace(CSS_COMMENT_REG, (substring, match) => {
                const origin = importMap[match];
                /* 替换后缀 */
                return ext ? String(origin).replace(/(\.[a-zA-Z0-9]+)(?=['"])/, ext) : origin;
            }));
        }
        save(file, ignoreList, ignoreNodeModules);
        // console.log('comment', String(file.contents));
        const s = new stream_1.default.Readable();
        s._read = function () { };
        s.push('null');
        s.pipe(through2_1.default.obj(function () {
            this.push(file);
        }))
            .pipe(compiler)
            .pipe(through2_1.default.obj((file) => {
            restore(file, ext);
            cb(null, file);
        }));
    });
}
module.exports = lightcss;
