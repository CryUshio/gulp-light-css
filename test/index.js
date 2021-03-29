/**
 * I'm lazy :)
 */
const test = require('ava');
const path = require('path');
const gulp = require('gulp');
const less = require('gulp-less');
const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');
const rimraf = require('rimraf');
const lightcss = require('../lib');

const readdir = promisify(fs.readdir);

const validator = async (expectDirname, dist, t) => {
  const distDirPath = path.resolve(__dirname, dist);
  const expectDirPath = path.resolve(__dirname, expectDirname);

  const readFileLine = (file) => {
    const arrayBuffer = [];
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: fs.createReadStream(file),
      });
      rl.on('line', (line) => {
        arrayBuffer.push(line);
      });
      rl.on('close', () => resolve(arrayBuffer));
    })
  }

  const validateContent = async (filepath, expectedFilepath, t) => {
    const [fileArray, expectFileArray] = await Promise.all([
      readFileLine(filepath),
      readFileLine(expectedFilepath),
    ]);

    for(let i = 0; i < expectFileArray.length; i++) {
      const expectLine = expectFileArray[i];
      const fileLine = fileArray[i];

      if (expectLine !== fileLine) {
        t.fail(`Validate failed in ${path.basename(filepath)}\n  at line ${i + 1}:\n${fileLine}\n\nExpected:\n${expectLine}`);
      }
    }

    if (fileArray.length > expectFileArray.length) {
      t.fail(`Validate failed in ${path.basename(filepath)}\n  at line ${expectFileArray.length}:\n${fileArray[expectFileArray.length]}\n\nExpected Empty!`);
    }
  }

  const validateFileCount = async () => {
    const [distDir, expDir] = await Promise.all([
      readdir(distDirPath),
      readdir(expectDirPath)
    ]);

    for await (filename of expDir) {
      const distFileIndex = distDir.indexOf(filename);
      if (distFileIndex < 0) {
        t.fail(`Validate failed. Expected file '${filename}' not found.`);
      }
      distDir.splice(distFileIndex, 1);
      const filepath = path.resolve(distDirPath, filename);
      const expectedFilepath = path.resolve(expectDirPath, filename);

      await validateContent(filepath, expectedFilepath, t);
    }

    if (distDir.length > 0) {
      t.fail(`Validate failed. Unexpected files: \n${dir.toString()}`);
    }
  }

  await validateFileCount();
  t.pass();
}

test('functional test', (t) => {
  const DIST = 'dist1';
  return new Promise((resolve) => {
    rimraf.sync(path.resolve(__dirname, DIST));
    gulp.src('./src/*.less', { cwd: __dirname })
      .pipe(lightcss({
        compiler: less(),
        ignores: ['**/_var.less', '**/copy.less'],
        ext: '.css'
      }))
      .pipe(gulp.dest(DIST, { cwd: __dirname }))
      .on('end', async () => {
        await validator('expect1', DIST, t);
        resolve()
      });
  });
});

test('functional test with not pack ignored files', (t) => {
  const DIST = 'dist2';
  return new Promise((resolve) => {
    rimraf.sync(path.resolve(__dirname, DIST));
    gulp.src('./src/*.less', { cwd: __dirname })
      .pipe(lightcss({
        compiler: less(),
        ignores: ['**/_var.less', '**/copy.less'],
        ext: '.css',
        notPackIgnoreFiles: true
      }))
      .pipe(gulp.dest(DIST, { cwd: __dirname }))
      .on('end', async () => {
        await validator('expect2', DIST, t);
        resolve()
      });
  });
});
