/*
 *
 * Copyright 2014 Canonical Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

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

  var flags = (opts.inspector) ? '--inspector' : '';
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
