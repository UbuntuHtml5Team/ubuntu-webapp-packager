/**
* This module is responsible of generating options from the command
* line arguments.
*/
var fs = require('fs');
require('colors');

var logger = require('./logger');
var packager = require('../index');

function readConfiguration(confPath) {
  var stat = fs.statSync(confPath);
  if (!stat.isFile()) {
    logger.error('Configuration is not a file: ' + confPath);
    showHelp();
  }

  try {
    var content = fs.readFileSync(confPath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    logger.error('Failed to load the configuration at: ' + confPath);
    showHelp();
  }
}

function showHelp() {
  console.log('Usage: ');
  console.log('packager -c [config path] [source]');
  console.log('Configuration is mandatory, source is not. Source points on the folder'
    + ' that contains the web application to be packaged');
  process.exit(1);
}

module.exports.run = function (args) {
  if (!args.c) {
    logger.error('Please provide a configuration using -c');
    showHelp();
  }

  var opts = readConfiguration(args.c);

  // Check if the user has provided a source directory
  var source = opts.src;
  if (!source && args._.length > 0) {
    source = opts.src = args._[0];
  }

  if (!source) {
    logger.error('The configuration does not contain a source and none has been provided.')
    showHelp();
  }

  packager(opts);
};
