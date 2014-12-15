'use strict';

var path = require('path');
var shell = require('shelljs');
var _ = require('lodash');

var Constants = require('./constants');
var logger = require('./logger');

module.exports.copyTemplateFiles = function (dest) {
  logger.info('Copying template files for Click generation');
  shell.cp(path.join(__dirname, '..', 'templates', '*'), dest);
};

module.exports.fillApplicationManifest = function (dest, data) {
  logger.info('Replacing values in application manifest');
  var manifestPath = path.join(dest, 'manifest.json');
  if (!shell.test('-f', manifestPath)) {
    logger.fatal('Could not find application manifest at:' + manifestPath);
  }

  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      shell.sed('-i', '<% ' + key.toUpperCase() + ' %>', data[key], manifestPath);
    }
  }
};

module.exports.fillApplicationDesktop = function (dest, opts) {
  logger.info('Replacing values in application desktop file');
  var desktopPath = path.join(dest, 'app.desktop');
  if (!shell.test('-f', desktopPath)) {
    logger.fatal('Could not find application desktop at:' + desktopPath);
  }

  var flags = '';
  if (opts.inspector) {
    flags = '--inspector';
    if (opts.inspector_port) {
      flags += '=' + opts.inspector_port;
    }
  }

  shell.sed('-i', '<% TITLE %>', opts.manifest.title, desktopPath);
  shell.sed('-i', '<% FLAGS %>', flags, desktopPath);
  shell.sed('-i', '<% MAIN_HTML %>', opts.main_html, desktopPath);
};

module.exports.fillApplicationApparmor = function(dest, opts) {
  logger.info('Replacing values in application apparmor file');

  var apparmorPath = path.join(dest, 'app.apparmor');
  if (!shell.test('-f', apparmorPath)) {
    logger.fatal('Could not find application apparmor at:' + apparmorPath);
  }

  shell.sed('-i', '<% POLICY_GROUPS %>', JSON.stringify(opts.apparmor.policy_groups), apparmorPath);
  shell.sed('-i', '<% POLICY_VERSION %>', opts.apparmor.policy_version, apparmorPath);
};
