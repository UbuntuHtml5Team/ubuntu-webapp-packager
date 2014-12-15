'use strict';

var shell = require('shelljs');
var logger = require('./logger');

var DEPENDENCIES = [
    'click',
    'click-reviewers-tools',
    'ubuntu-sdk'
];

module.exports = function () {
  logger.info('Checking local environment for missing dependencies');
  var deps = DEPENDENCIES.join(' ');
  var status = shell.exec("dpkg-query -Wf'${db:Status-abbrev}\\n'" + deps);
  if (status.code !== 0) {
    logger.warn('Missing required dependency: ' + deps);
    return false;
  }

  return true;
};
