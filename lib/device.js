'use strict';

var assert = require('assert');
var Utils = require('./utils');

var logger = require('./logger');

module.exports.list = function () {
    logger.info('Searching for connected devices');

    var res = Utils.execSync('adb devices', {silent: false});
    var response = res.output.split('\n');
    var deviceList = [];

    for (var i = 1; i < response.length; i++) {
        if (response[i].match(/\w+\tdevice/)) {
            deviceList.push(response[i].replace(/\tdevice/, '').replace('\r', ''));
        }
    }

    return deviceList;
};

module.exports.isAttached = function (target) {
    var res = adbExec(target, 'get-state');

    if (res.output.indexOf('device') == -1)
        return false;

    res = adbExec(target, 'shell uname -a');
    if (res.output.indexOf('ubuntu-phablet') == -1)
        return false;

    return true;
};

module.exports.arch = function (target) {
    var out = adbExec(target, 'shell "dpkg --print-architecture 2>/dev/null"').output.split('\r\n');

    assert.ok(out.length == 2 && out[0].indexOf(' ') == -1);

    return out[0];
};

function adbExec(target, command, options) {
    assert.ok(target && command);
    options = options || {};
    return Utils.execSync('adb -s ' + target + ' ' + command, options);
}

function adbExecAsync(target, command, options) {
    assert.ok(target && command);
    options = options || {};
    return Utils.execAsync('adb -s ' + target + ' ' + command, options.silent);
}

module.exports.adbExec = adbExec;
module.exports.adbExecAsync = adbExecAsync;
