var every   = require('every-moment');
var easyZip = require('easy-zip');
var logger  = require('./logger');
var utils   = require('./utils');
var config  = require('../config');

var lastHash = "";

function isBackupNeeded()
{
    var files = utils.getFileList("../data/saves/");

    var hash = "";

    for(var i = 0; i < files.length; i++)
    {
        var file = "../data/saves/" + files[i];
        var md5 = utils.md5File(file);

        hash += md5;
    }

    hash = utils.md5(hash);

    var needed = (lastHash != hash);
    lastHash = hash;

    return needed;
}

function backupStats()
{
    if(isBackupNeeded())
    {
        var zip = new easyZip.EasyZip();

        zip.zipFolder("../data/saves",function()
        {
            zip.writeToFile("../data/backups/" + utils.fileTimestamp() + ".zip");
            logger.info("Stats backup done!");
        });
    }
    else
    {
        logger.info("No need to backup stats. Nothing has changed!");
    }
}

function start()
{
    if(config.enableBackups)
    {
        utils.createDir("../data/");
        utils.createDir("../data/backups/");

        every(config.backupInterval[0], config.backupInterval[1], backupStats);
    }
}

exports.start = start;
