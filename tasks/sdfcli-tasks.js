var spawn = require('child_process').spawn;
var through2 = require('through2');
var util = require('util');
var fs = require('fs');
var _ = require('lodash');
var gulp = require('gulp');
var readdirPromise = util.promisify(fs.readdir);
var authId = require('../package.json').name;
var cliPath = 'sdf-cli/cli-2020.1.0.jar';

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
		return through2.obj(function (chunk, encoding, callback) {
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
		return through2.obj(function (chunk, encoding, callback) {
			stdOutTransformOptions.promiseArrayValue.push.apply(
				stdOutTransformOptions.promiseArrayValue,
				chunk
					.toString(encoding)
					.split(/[\r\n=]+/g)
					.filter(function (line) {
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
		['-jar', cliPath, command].concat(cliArguments),
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
	return new Promise(function (resolve, reject) {
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

function importFolder(fileCabinetFolderPath) {
	return new Promise(function (resolve, reject) {
		spawnSdfCliProcess(
			'listfiles',
			['-folder', fileCabinetFolderPath, '-authid', authId],
			{ stdio: ['inherit', 'pipe', 'inherit'] },
			resolve,
			reject,
			{ promiseArrayValue: [] }
		);
	}).then(function (fileCabinetPaths) {
		return Promise.all(
			// there is a maximum length to the arguments that can be passed in a
			// command. Chunking is a cheap way to try and limit the length
			// more efficient is to calculate how long the cli arg string is
			// there is also a limit on the number of listeners on Stream's event
			// emitter. It may be wise to increase that limit
			_.chunk(fileCabinetPaths, 256).map(function (chunkOfFileCabinetPaths) {
				return new Promise(function (resolve, reject) {
					spawnSdfCliProcess(
						'importfiles',
						['-p', '.', '-authid', authId, '-paths'].concat(
							chunkOfFileCabinetPaths
						),
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
	return readdirPromise('./FileCabinet/SuiteScripts', {
		withFileTypes: true,
	}).then(function (dirents) {
		return Promise.all(
			dirents
				.filter(function (dirent) {
					return dirent.isDirectory();
				})
				.map(function (dirent) {
					return importFolder('/SuiteScripts/' + dirent.name);
				})
		);
	});
}

function importObjects(scriptIds) {
	return new Promise(function (resolve, reject) {
		spawnSdfCliProcess(
			'importobjects',
			[
				'-p',
				'.',
				'-type',
				'ALL',
				'-destinationfolder',
				'/Objects',
				'-authid',
				authId,
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
	return readdirPromise('./Objects').then(function (fileNames) {
		// I dont think chunking the objects is necessary.
		// your project is insane if it has so many objects
		return importObjects(
			fileNames
				.filter(function (fileName) {
					// this does not support folders
					return fileName.substring(fileName.length - 4) === '.xml';
				})
				.map(function (fileName) {
					return fileName.substring(0, fileName.length - 4);
				})
		);
	});
}

module.exports.deploy = function deploy() {
	// so far, deploy is the only command nice enough to run without babysitting
	return spawn(
		'java',
		['-jar', cliPath, 'deploy', '-np', '-sw', '-p', '.', '-authid', authId],
		{ stdio: ['inherit', 'inherit', 'inherit'] }
	);
};

module.exports.authenticate = function authenticate() {
	return new Promise(function (resolve, reject) {
		spawnSdfCliProcess(
			'manageauth',
			['-remove', authId],
			{ stdio: ['inherit', 'inherit', 'inherit'] },
			resolve,
			reject
		);
	}).then(function () {
		return new Promise(function (resolve, reject) {
			spawnSdfCliProcess(
				'authenticate',
				['-authid', authId],
				{ stdio: ['inherit', 'inherit', 'inherit'] },
				resolve,
				reject
			);
		});
	});
};

module.exports['import'] = gulp.parallel(
	importProjectFiles,
	addDependencies,
	importProjectObjects
);
