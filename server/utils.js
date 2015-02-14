var fs  = require('fs');
var dns = require('dns');

function resolveHost(hostname, callback, param)
{
    dns.lookup(hostname, { family: 4, hints: dns.ADDRCONFIG | dns.V4MAPPED }, function(err, addresses, family)
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

    if(number < 10)
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
    if(!fs.existsSync(path))
    {
        fs.mkdirSync(path);
    }
}

function overwriteFile(file, data)
{
    if(fs.existsSync(file))
    {
        fs.unlinkSync(file);
    }

    fs.writeFileSync(file, data);
}

exports.getIP         = getIP;
exports.resolveHost   = resolveHost;
exports.formatTimeNum = formatTimeNum;
exports.fileTimestamp = fileTimestamp;
exports.logTimestamp  = logTimestamp;
exports.createDir     = createDir;
exports.overwriteFile = overwriteFile;
