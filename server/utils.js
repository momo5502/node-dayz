var fs = require('fs');
var dns = require('dns');
var crypto = require('crypto');

function resolveHost(hostname, callback, param)
{
  dns.lookup(hostname,
  {
    family: 4,
    hints: dns.ADDRCONFIG | dns.V4MAPPED
  }, function(err, addresses, family)
  {
    callback(err, addresses, family, param);
  });
}

function getIP(request)
{
  return request.connection.remoteAddress;
}

function formatTimeNum(number)
{
  var string = "" + number;

  if (number < 10)
  {
    string = "0" + string;
  }

  return string;
}

function fileTimestamp()
{
  var date = new Date();
  var year = date.getFullYear();
  var month = formatTimeNum(date.getMonth());
  var day = formatTimeNum(date.getDate());

  var hours = formatTimeNum(date.getHours());
  var minutes = formatTimeNum(date.getMinutes());
  var seconds = formatTimeNum(date.getSeconds());

  return year + "-" + month + "-" + day + " " + hours + "-" + minutes + "-" + seconds;
}

function logTimestamp()
{
  var date = new Date();
  var hours = formatTimeNum(date.getHours());
  var minutes = formatTimeNum(date.getMinutes());
  var seconds = formatTimeNum(date.getSeconds());

  return "[" + hours + ":" + minutes + ":" + seconds + "] ";
}

function createDir(path)
{
  if (!fs.existsSync(path))
  {
    fs.mkdirSync(path);
  }
}

function deleteFile(file)
{
  if (fs.existsSync(file))
  {
    fs.unlinkSync(file);
  }
}

function overwriteFile(file, data)
{
  deleteFile(file);
  fs.writeFileSync(file, data);
}

function md5(data)
{
  var hash = crypto.createHash('md5');
  hash.setEncoding('hex');
  hash.write(data);
  hash.end();
  return hash.read();
}

function md5File(file)
{
  var hash = "";

  if (fs.existsSync(file))
  {
    var data = fs.readFileSync(file);
    hash = md5(data);
  }

  return hash;
}

function getFileList(path)
{
  var array = [];

  if (fs.existsSync(path))
  {
    array = fs.readdirSync(path);
  }

  return array;
}

function parseBool(string)
{
  var low = string.trim().toLowerCase();
  return (low === "true" || low === "1");
}

exports.getIP = getIP;
exports.resolveHost = resolveHost;
exports.formatTimeNum = formatTimeNum;
exports.fileTimestamp = fileTimestamp;
exports.logTimestamp = logTimestamp;
exports.createDir = createDir;
exports.deleteFile = deleteFile;
exports.overwriteFile = overwriteFile;
exports.md5File = md5File;
exports.md5 = md5;
exports.getFileList = getFileList;
exports.parseBool = parseBool;
