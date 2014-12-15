'use strict';

var shellCfg = require('shelljs').config;

/**
 * The configuration is used by other tasks to access shared properties, such as if the tasks are
 * running in verbose mode (more logs, and outputs from various commands).
 */
function Config() {
    this._verbose = false;
    shellCfg.silent = true;
}

Config.prototype = {
    verboseMode: function () {
        this._verbose = true;
        shellCfg.silent = false;
    },

    inVerboseMode: function () {
        return this._verbose;
    }
};

module.exports = new Config();
