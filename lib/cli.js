/**
* This module is responsible of generating options from the command
* line arguments.
*/
var fs = require('fs');
require('colors');

var logger = require('./logger');
var packager = require('../index');

function readConfiguration(confPath) {
  try {
    var stat = fs.statSync(confPath);
    if (!stat.isFile()) {
      logger.error('Configuration is not a file: ' + confPath);
      showHelp();
    }

    var content = fs.readFileSync(confPath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    logger.error('Failed to load the configuration at: ' + confPath);
    showHelp();
  }
}

function showHelp() {
  console.log('Usage: ');
  console.log('ubuntu-webapp-packager [config path] -s [source directory] -d [destination directory]');
  console.log('Source and destination folders can be provided through the configuration'
  + ' or as arguments (in order).');
  console.log('If provided as arguments, they override the value specified in the configuration.');
  process.exit(1);
}

module.exports.run = function (args) {
  var configPath = args._[0];
  if (!configPath) {
    logger.error('Please provide a configuration path.');
    showHelp();
  }

  var opts = readConfiguration(configPath);

  if (args.s) {
    opts.src = args.s;
  }
  if (args.d) {
    opts.dest = args.d;
  }

  if (!opts.src) {
    logger.error('No source specified using -s and no "src" configuration property could be found in: ' + configPath);
    showHelp();
  }

  if (!opts.dest) {
    logger.error('No destination specified using -d and no "dest" configuration property could be found in: ' + configPath);
    showHelp();
  }

  packager(opts);
};
