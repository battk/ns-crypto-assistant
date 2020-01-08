var spawn = require('child_process').spawn;
var through2 = require('through2');
var util = require('util');
var fs = require('fs');
var _ = require('lodash');
var gulp = require('gulp');
var readdirPromise = util.promisify(fs.readdir);

function parseSdfFile(sdfContents) {
	return sdfContents
		.split(/[\r\n=]+/g)
		.filter(function(isEmpty) {
			return !!isEmpty;
		})
		.map(function(sdfArgument, index) {
			return index % 2 ? sdfArgument : '-' + sdfArgument;
		});
}

function processDoneListener(command, resolve, reject, value, code, signal) {
	if (code === 0) {
		resolve(value);
	} else {
		reject(
			new Error(
				'sdfcli ' +
					command +
					' command failed with code: ' +
					code +
					' or signal: ' +
					signal
			)
		);
	}
}

function generateStdOutTransform(childProcess, stdOutTransformOptions) {
	if (stdOutTransformOptions.promptString) {
		return through2.obj(function(chunk, encoding, callback) {
			if (
				chunk
					.toString(encoding)
					.indexOf(stdOutTransformOptions.promptString) === 0
			) {
				childProcess.stdin.write('YES\n');
			}
			callback();
		});
	} else if (stdOutTransformOptions.promiseArrayValue) {
		return through2.obj(function(chunk, encoding, callback) {
			stdOutTransformOptions.promiseArrayValue.push.apply(
				stdOutTransformOptions.promiseArrayValue,
				chunk
					.toString(encoding)
					.split(/[\r\n=]+/g)
					.filter(function(line) {
						return line && line.charAt(0) === '/';
					})
			);
			callback();
		});
	}

	// honestly it feels weird throwing an error for an internal function
	throw new Error('Unrecognized stdOutTransformOptions');
}

function spawnSdfCliProcess(
	command,
	cliArguments,
	processOptions,
	resolve,
	reject,
	stdOutTransformOptions
) {
	var doneListener = processDoneListener.bind(
		this,
		command,
		resolve,
		reject,
		stdOutTransformOptions && stdOutTransformOptions.promiseArrayValue
	);
	var sdfCliProcess = spawn(
		'java',
		['-jar', 'sdf-cli/cli-2019.2.1.jar', command].concat(cliArguments),
		processOptions
	)
		.on('error', reject)
		.on('close', doneListener)
		.on('exit', doneListener);
	if (processOptions.stdio[1] !== 'inherit') {
		sdfCliProcess.stdout.pipe(process.stdout);

		if (stdOutTransformOptions) {
			sdfCliProcess.stdout.pipe(
				generateStdOutTransform(sdfCliProcess, stdOutTransformOptions)
			);
		}
	}

	return sdfCliProcess;
}

function addDependencies() {
	return new Promise(function(resolve, reject) {
		spawnSdfCliProcess(
			'adddependencies',
			['-p', '.', '-all'],
			{ stdio: ['pipe', 'pipe', 'inherit'] },
			resolve,
			reject,
			{
				promptString:
					'Manifest file will be updated to add the dependencies, do you want to continue? Type YES to update the manifest file.',
			}
		);
	});
}

function importFolder(sdfArguments, fileCabinetFolderPath) {
	return new Promise(function(resolve, reject) {
		spawnSdfCliProcess(
			'listfiles',
			['-folder', fileCabinetFolderPath].concat(sdfArguments),
			{ stdio: ['inherit', 'pipe', 'inherit'] },
			resolve,
			reject,
			{ promiseArrayValue: [] }
		);
	}).then(function(fileCabinetPaths) {
		return Promise.all(
			// there is a maximum length to the arguments that can be passed in a
			// command. Chunking is a cheap way to try and limit the length
			// more efficient is to calculate how long the cli arg string is
			// there is also a limit on the number of listeners on Stream's event
			// emitter. It may be wise to increase that limit
			_.chunk(fileCabinetPaths, 256).map(function(chunkOfFileCabinetPaths) {
				return new Promise(function(resolve, reject) {
					spawnSdfCliProcess(
						'importfiles',
						['-p', '.', '-paths'].concat(chunkOfFileCabinetPaths),
						{ stdio: ['pipe', 'pipe', 'inherit'] },
						resolve,
						reject,
						{
							promptString:
								'Existing files will be overwritten, do you want to continue? Type YES to continue.',
						}
					);
				});
			})
		);
	});
}

function importProjectFiles() {
	return util
		.promisify(fs.readFile)('.sdf', 'utf8')
		.then(function(sdfContents) {
			var sdfArguments = parseSdfFile(sdfContents);

			return readdirPromise('./FileCabinet/SuiteScripts', {
				withFileTypes: true,
			}).then(function(dirents) {
				return Promise.all(
					dirents
						.filter(function(dirent) {
							return dirent.isDirectory();
						})
						.map(function(dirent) {
							return importFolder(sdfArguments, '/SuiteScripts/' + dirent.name);
						})
				);
			});
		});
}

function importObjects(scriptIds) {
	return new Promise(function(resolve, reject) {
		spawnSdfCliProcess(
			'importobjects',
			[
				'-p',
				'.',
				'-type',
				'ALL',
				'-destinationfolder',
				'/Objects',
				'-scriptid',
			].concat(scriptIds),
			{ stdio: ['pipe', 'pipe', 'inherit'] },
			resolve,
			reject,
			{
				promptString:
					'Existing objects will be overwritten, do you want to continue? Type Yes (Y) to continue.',
			}
		);
	});
}

function importProjectObjects() {
	return readdirPromise('./Objects').then(function(fileNames) {
		// I dont think chunking the objects is necessary.
		// your project is insane if it has so many objects
		return importObjects(
			fileNames
				.filter(function(fileName) {
					// this does not support folders
					return fileName.substring(fileName.length - 4) === '.xml';
				})
				.map(function(fileName) {
					return fileName.substring(0, fileName.length - 4);
				})
		);
	});
}

module.exports.deploy = function() {
	// so far, deploy is the only command nice enough to run without babysitting
	return spawn(
		'java',
		['-jar', 'sdf-cli/cli-2019.2.1.jar', 'deploy', '-np', '-sw', '-p', '.'],
		{ stdio: ['inherit', 'inherit', 'inherit'] }
	);
};
module.exports['import'] = gulp.parallel(
	importProjectFiles,
	addDependencies,
	importProjectObjects
);
