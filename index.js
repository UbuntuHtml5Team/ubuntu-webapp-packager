'use strict';

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

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var cwd = process.cwd();
require('colors');

var Constants = require('./lib/constants');
var Devices = require('./lib/device');
var checkRequirements = require('./lib/check_reqs');
var logger = require('./lib/logger');
var templates = require('./lib/templates');

function createDestinationFolders(dest) {
  logger.info('Creating necessary folders for building...');
  if (!shell.test('-e', dest)) {
    shell.mkdir(dest);
  }

  if (!shell.test('-d', dest)) {
    logger.fatal('Destination is not a directory: ' + dest);
  }

  shell.pushd(dest);
  if (shell.ls().length > 0) {
    shell.rm('-rf', '*');
  }
  shell.mkdir(path.join(dest, 'www'));
  shell.popd();
}

function copyWebAppFiles(src, dest, opts) {
  logger.info('Copying web application assets to destination...');

  if (!shell.test('-d', src)) {
    logger.fatal('Invalid source directory: ' + src);
  }

  if (!shell.ls(src).length) {
    logger.fatal('Source directory is empty: ' + src);
  }

  if (!shell.test('-f', path.join(src, opts.main_html))) {
    logger.fatal('No ' + opts.main_html + ' file in source directory: ' + src);
  }

  shell.cp('-r', path.join(src, '*'), path.join(dest, 'www'));
}

function buildClickPackage(dest, opts) {
  logger.info('Building Click package...');

  shell.pushd(dest);
  var flags = (!opts.validate) ? ' --no-validate' : '';
  var result = shell.exec('click build .' + flags);
  if (result.code !== 0) {
    logger.fatal('Failed to build click package: ' +  result.output);
  }
  shell.popd();
}

function deployClickPackage(dest, opts) {
  var devices = Devices.list();
  if (!devices.length) {
    logger.fatal('Could not detect a connected device.');
  }

  var target = devices[0];
  if (devices.length > 1) {
    logger.warn('Multiple targets found, you can specify target with --target <device id>');
  }

  var appId = opts.manifest.id;
  var names = shell.ls(dest);
  names = _.filter(names, function (name) {
    return name.indexOf(appId) !== -1 && name.indexOf('.click') !== -1;
  });

  if (!names.length) {
    logger.fatal('No click package found in ' + dest);
  } else if (names.length > 1) {
    logger.warn('Multiple click found in ' + dest + ', using: ' + names[0]);
  }

  // logger.info('Killing application if already running on your device.');
  // Devices.adbExec(target, 'shell "ps -A -eo pid,cmd | grep cordova-ubuntu | awk \'{ print \\$1 }\' | xargs kill -9"');

  shell.pushd(dest);

  logger.info('Deploying the application on your device.');
  Devices.adbExec(target, 'push ' + names[0] + ' /home/phablet');

  logger.info('Installing the application on your device.');
  Devices.adbExec(target, 'shell "cd /home/phablet/; pkcon install-local ' + names[0] + ' -p --allow-untrusted -y"', {silent: false});

  // if (debug) {
  //   logger.warn('Debug enabled. Try pointing a WebKit browser to http://127.0.0.1:9222');
  //   Devices.adbExec(target, 'forward tcp:9222 tcp:9222');
  // }

  logger.info('Launching the application on your device.');

  Devices.adbExec(target, 'shell bash -c "ubuntu-app-launch  \\`ubuntu-app-triplet ' + appId + '\\`"');

  logger.rainbow('All done. Have fun!');

  shell.popd();
}

module.exports = function (opts) {
  if (!checkRequirements()) {
    logger.fatal('Error: missing dependency.');
  }

  opts = opts || {};
  opts = _.defaults(opts, {
    src: Constants.DEFAULT_SOURCE,
    dest: Constants.DEFAULT_DEST,
    validate: true,
    install: true,
    server: false,
    inspector: true,
    manifest: _.defaults(opts.manifest, {
      description: Constants.DEFAULT_DESC,
      framework: Constants.DEFAULT_FRAMEWORK,
      maintainer: Constants.DEFAULT_MAINTAINER,
      maintainer_email: Constants.DEFAULT_MAINTAINER_EMAIL,
      id: Constants.DEFAULT_ID,
      title: Constants.DEFAULT_TITLE,
      version: Constants.DEFAULT_VERSION
    }),
    main_html: Constants.DEFAULT_MAIN_HTML
  });

  logger.info('Using configuration: '.white + JSON.stringify(opts));

  var src = path.join(cwd, opts.src);
  var dest = path.join(cwd, opts.dest);

  createDestinationFolders(dest);

  // Copy the default application manifest, desktop and apparmor files
  templates.copyTemplateFiles(dest);

  // Replace the template in the application manifest (manifest.json).
  templates.fillApplicationManifest(dest, opts.manifest);

  // Replace the template in the application desktop file (app.desktop).
  templates.fillApplicationDesktop(dest, opts);

  copyWebAppFiles(src, dest, opts);

  buildClickPackage(dest, opts);
  if (opts.install) {
    deployClickPackage(dest, opts);
  }
};
