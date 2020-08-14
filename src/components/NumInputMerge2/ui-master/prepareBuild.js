/**
 * Used to copy static assets (like JSONs) platform independently to their correct directory under service/build.
 */

const shell = require('shelljs');

// Clean output directory
shell.rm('-rf', 'dist');

// Copy all non-ts artifacts from the /src to the /build directory to make the build dir fully functional
shell.mkdir('dist');
shell.mkdir('dist/server');
shell.mkdir('dist/server/ts');
shell.cp('-R', 'src/locales', 'dist/server/ts/locales');
shell.cp('-R', 'config', 'dist/server/ts/config');
shell.cp('-R', 'src/server/views', 'dist/server/ts/views');

/*

shell.mkdir('build/src/util');
shell.cp('src/util/logging_config.json', 'build/src/util/logging_config.json');
shell.cp('-R', 'src/engine/data', 'build/src/engine/data');
shell.cp('package.json', 'build/package.json');
shell.mkdir('build/src/api');
shell.cp('src/api/api-doc-4-dispatcher.yaml', 'build/src/api/api-doc-4-dispatcher.yaml'); */

// Unit test files
/*  shell.mkdir('-p', 'build/test/mocks');
shell.cp('-R', 'test/mocks/data', 'build/test/mocks/data');
shell.mkdir('build/test/tests');
shell.cp('-R', 'test/tests/data', 'build/test/tests/data');
shell.cp('src/util/test_logging_config.json', 'build/src/util/test_logging_config.json');
*/
