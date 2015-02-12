var colors = require('colors/safe');

// DayZ uses IPv4, so that's fine
function getRequestIP(request)
{
  if(request == null) return "";

  var ipv6 = request.connection.remoteAddress;
  var ipv4 = ipv6.substring(ipv6.lastIndexOf(":") + 1);
  return "[" + ipv4 + "] ";
}

function log(message, request)
{
  console.log(getRequestIP(request) + message);
}

function warn(message, request)
{
  console.warn(colors.yellow(getRequestIP(request) + message));
}

function error(message, request)
{
  console.error(colors.red(getRequestIP(request) + message));
}

function info(message, request)
{
  console.info(colors.cyan(getRequestIP(request) + message));
}

exports.log   = log;
exports.warn  = warn;
exports.error = error;
exports.info  = info;
