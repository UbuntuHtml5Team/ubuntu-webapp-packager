/**
* This module is responsible of generating options from the command
* line arguments.
*/
require('colors');
var path = require('path');

var cwd = process.cwd();
var logger = require('./logger');
var packager = require('../index');
var Utils = require('./utils');

function showHelp() {
  console.log('Usage: ');
  console.log('ubuntu-webapp-packager [config path] (options)');
  console.log('Source and destination folders can be provided through the configuration'
  + ' or as arguments (see below).');
  console.log('If provided as arguments, they override the value specified in the configuration.');
  console.log('Available options are: ');
  console.log('--source <source folder>: Folder that contains the web application to be packaged.');
  console.log('--dest <destination folder>: Folder where the packaged application will be stored after generation.');
  console.log('--inspector <port>: Enable a remote inspector for you to debug your web application. If no port is provided, it will run on 9221.');
  console.log('--verbose: Provide additional logs.')
  process.exit(1);
}

module.exports.run = function (args) {
  var configPath = args._[0];
  if (!configPath) {
    logger.error('Please provide a configuration path.');
    showHelp();
  }

  var opts = Utils.readJSONFile(path.join(cwd, configPath));
  if (!opts) {
    showHelp();
  }

  if (args.s) {
    opts.src = args.s;
  }
  if (args.d) {
    opts.dest = args.d;
  }
  if (args.inspector) {
    opts.inspector = true;
  }
  if (typeof args.inspector !== 'boolean') {
    opts.inspector_port = args.inspector;
  }
  if (args.verbose) {
    opts.verbose = true;
  }

  if (!opts.src) {
    logger.error('No source specified using --source and no "src" configuration property could be found in: ' + configPath);
    showHelp();
  }

  if (!opts.dest) {
    logger.error('No destination specified using --dest and no "dest" configuration property could be found in: ' + configPath);
    showHelp();
  }

  packager(opts);
};
