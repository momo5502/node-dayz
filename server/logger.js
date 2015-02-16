var clc   = require('cli-color');
var utils = require('./utils');

function log(message)
{
    console.log(utils.logTimestamp() + message);
}

function warn(message)
{
    console.warn(clc.yellowBright(utils.logTimestamp() + message));
}

function error(message)
{
    console.error(clc.redBright(utils.logTimestamp() + message));
}

function info(message)
{
    console.info(clc.cyanBright(utils.logTimestamp() + message));
}

exports.log   = log;
exports.warn  = warn;
exports.error = error;
exports.info  = info;
