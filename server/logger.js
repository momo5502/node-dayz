var clc   = require('cli-color');
var utils = require('./utils');

function log(message, request)
{
  console.log(utils.logTimestamp() + message);
}

function warn(message, request)
{
  console.warn(clc.yellowBright(utils.logTimestamp() + message));
}

function error(message, request)
{
  console.error(clc.redBright(utils.logTimestamp() + message));
}

function info(message, request)
{
  console.info(clc.cyanBright(utils.logTimestamp() + message));
}

exports.log   = log;
exports.warn  = warn;
exports.error = error;
exports.info  = info;
