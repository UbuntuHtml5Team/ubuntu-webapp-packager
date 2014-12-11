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
var path = require('path');
var shell = require('shelljs');
var cwd = process.cwd();
require('colors');

var checkRequirements = require('./lib/check_reqs');
var Constants = require('./lib/constants');
var Devices = require('./lib/device');
var logger = require('./lib/logger');
var templates = require('./lib/templates');
var Utils = require('./lib/utils');

function createDestinationFolders(dest) {
  logger.info('Creating necessary folders for building...');
  if (!shell.test('-e', dest)) {
    shell.mkdir(dest);
  }

  if (!shell.test('-d', dest)) {
    logger.fatal('Destination is not a directory: ' + dest);
  }

  Utils.pushd(dest);
  if (shell.ls().length > 0) {
    shell.rm('-rf', '*');
  }
  shell.mkdir(path.join(dest, 'www'));
  Utils.popd();
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

  Utils.pushd(dest);

  // Validation is done through click-run-checks
  Utils.execSync('click build . --no-validate');

  Utils.popd();
}

function validateClickPackage(dest, opts) {
  logger.info('Validating click package');

  var clickPath = findClickPackagePath(dest, opts);

  Utils.pushd(dest);

  var result = Utils.execSync('click-run-checks ' + clickPath, {ignore_result: true});
  if (result.code !== 0) {
    var lines = result.output.split('\n');
    var jsons = [];
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('= click-check-') === 0) {
        var nextLine;
        var jsonBlock = [];
        while ((nextLine = lines[++i]) && nextLine !== '') {
          jsonBlock.push(nextLine);
        }
        jsons.push(jsonBlock.join('\n'));
      }
    }

    var output = '';
    // Parse each json block and look for errors
    for (var i = jsons.length - 1; i >= 0; i--) {
      var json = JSON.parse(jsons[i]);
      if (Object.getOwnPropertyNames(json.error).length > 0) {
        output += JSON.stringify(json.error, null, 4) + '\n';
      }
    }

    if (output.length) {
      logger.warn('Errors have been found: \n' + output + 'These errors might prevent the application from running.');
    }
  }

  Utils.popd();
}

function findClickPackagePath(dest, opts) {
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

  return names[0];
}

function deployClickPackage(dest, opts) {
  var devices = Devices.list();
  if (!devices.length) {
    logger.fatal('Could not detect a connected device.');
  }

  var target = devices[0];
  if (devices.length > 1) {
    logger.warn('Multiple targets found, you can specify target with --target <device id>, using ' + target);
  }

  var clickPath = findClickPackagePath(dest, opts);
  var appId = opts.manifest.id;

  // logger.info('Killing application if already running on your device.');
  // Devices.adbExec(target, 'shell "ps -A -eo pid,cmd | grep cordova-ubuntu | awk \'{ print \\$1 }\' | xargs kill -9"');

  Utils.pushd(dest);

  logger.info('Deploying the application on your device.');
  Devices.adbExec(target, 'push ' + clickPath + ' /home/phablet');

  logger.info('Installing the application on your device.');
  Devices.adbExec(target, 'shell "cd /home/phablet/; pkcon install-local ' + clickPath + ' -p --allow-untrusted -y"', {silent: false});

  if (opts.inspector) {
    var port = !!(opts.inspector_port) ? opts.inspector_port : '9221';
    logger.warn('Inspector enabled. Try pointing a WebKit browser to http://127.0.0.1:' + port);
    Devices.adbExec(target, 'forward tcp:' + port + ' tcp:' + port);
  }

  logger.info('Launching the application on your device.');

  Devices.adbExec(target, 'shell bash -c "ubuntu-app-launch  \\`ubuntu-app-triplet ' + appId + '\\`"');

  logger.rainbow('All done. Have fun!');

  Utils.popd();
}

module.exports = function (opts) {
  if (!checkRequirements()) {
    logger.fatal('Error: missing dependency.');
  } else if (!arguments.length === 0) {
    logger.fatal('Error: please provide a configuration path, or configuration object');
  }

  // If we are given a string, we check if the file pointed by the path is a configuration.
  if (typeof opts === "string") {
    opts = Utils.readJSONFile(path.join(cwd, opts));
  }

  opts = opts || {};
  opts.manifest = opts.manifest || {};
  opts.apparmor = opts.apparmor || {};

  opts = _.defaults(opts, {
    validate: true,
    install: true,
    server: false,
    inspector: false,
    verbose: false,
    manifest: _.defaults(opts.manifest, {
      description: Constants.DEFAULT_DESC,
      framework: Constants.DEFAULT_FRAMEWORK,
      maintainer: Constants.DEFAULT_MAINTAINER,
      maintainer_email: Constants.DEFAULT_MAINTAINER_EMAIL,
      id: Constants.DEFAULT_ID,
      title: Constants.DEFAULT_TITLE,
      version: Constants.DEFAULT_VERSION
    }),
    apparmor: _.defaults(opts.apparmor, {
      policy_version: Constants.DEFAULT_POLICY_VERSION,
      policy_groups: Constants.DEFAULT_POLICY_GROUPS
    }),
    main_html: Constants.DEFAULT_MAIN_HTML
  });

  if (opts.verbose) {
    require('./lib/config').verboseMode();
  }

  logger.info('Using configuration: '.white + JSON.stringify(opts, null, 4));

  if (!opts.src || typeof opts.src !== "string") {
    logger.fatal('Invalid or missing source directory.');
  } else if (!opts.dest || typeof opts.dest !== "string") {
    logger.fatal('Invalid or missing destination directory');
  }

  var src = path.join(cwd, opts.src);
  var dest = path.join(cwd, opts.dest);

  createDestinationFolders(dest);

  // Copy the default application manifest, desktop and apparmor files
  templates.copyTemplateFiles(dest);

  // Replace the template in the application manifest (manifest.json).
  templates.fillApplicationManifest(dest, opts.manifest);

  // Replace the template in the application desktop file (app.desktop).
  templates.fillApplicationDesktop(dest, opts);

  // Adjust the template in the application apparmor security file (app.apparmor)
  templates.fillApplicationApparmor(dest, opts);

  copyWebAppFiles(src, dest, opts);

  buildClickPackage(dest, opts);

  if (opts.validate) {
    validateClickPackage(dest, opts);
  }

  if (opts.install) {
    deployClickPackage(dest, opts);
  }
};
