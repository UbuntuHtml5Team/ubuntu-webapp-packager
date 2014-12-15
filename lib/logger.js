'use strict';


var colors = require('colors');
var config = require('./config');

/**
 * Output debug messages in white. If not in verbose mode, nothing is output.
 */
module.exports.debug = function (msg) {
    if (config.inVerboseMode()) {
        console.log(msg);
    }
};

/**
 * Output info messages in green to the console.
 */
module.exports.info = function (msg) {
    console.log(msg.green);
};

/**
 * Output warning messages in yellow to the console.
 */
module.exports.warn = function (msg) {
    console.warn(msg.yellow);
};

/**
 * Output error messages in red to the console.
 */
module.exports.error = function (msg) {
    console.error(msg.red);
};

/**
* Output an error message and close the application.
*/
module.exports.fatal = function (msg) {
  console.error(msg.red);
  process.exit(1);
};

module.exports.rainbow = function (msg) {
    console.log(msg.rainbow);
};
