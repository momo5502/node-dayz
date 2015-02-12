var colors = require('colors/safe');

function addLeadingZero(number)
{
  var string = "" + number;

  if(number < 10)
  {
    string = "0" + string;
  }

  return string;
}

function getTimeStamp()
{
  var date = new Date();
  var hours = addLeadingZero(date.getHours());
  var minutes = addLeadingZero(date.getMinutes());
  var seconds = addLeadingZero(date.getSeconds());

  return "[" + hours + ":" + minutes + ":" + seconds + "] ";
}

// DayZ uses IPv4, so that's fine
function getRequestIP(request)
{
  return ""; // Not necessary atm.

  if(request == null) return "";

  var ipv6 = request.connection.remoteAddress;
  var ipv4 = ipv6.substring(ipv6.lastIndexOf(":") + 1);
  return "[" + ipv4 + "] ";
}

function log(message, request)
{
  console.log(getTimeStamp() + getRequestIP(request) + message);
}

function warn(message, request)
{
  console.warn(colors.yellow(getTimeStamp() + getRequestIP(request) + message));
}

function error(message, request)
{
  console.error(colors.red(getTimeStamp() + getRequestIP(request) + message));
}

function info(message, request)
{
  console.info(colors.cyan(getTimeStamp() + getRequestIP(request) + message));
}

exports.log   = log;
exports.warn  = warn;
exports.error = error;
exports.info  = info;
