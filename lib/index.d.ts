/// <reference types="node" />
import stream from 'stream';
declare type Options = {
    ignores?: string[];
    compiler: NodeJS.ReadWriteStream | NodeJS.WriteStream;
    ignoreNodeModules?: boolean;
    ext?: string;
};
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
declare function lightcss(options: Options): stream.Transform;
export = lightcss;
