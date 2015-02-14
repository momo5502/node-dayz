var every   = require('every-moment');
var EasyZip = require('easy-zip').EasyZip;
var logger  = require('./logger');
var utils   = require('./utils');
var config  = require('../config');


function backupStats()
{
    var zip = new EasyZip();

    zip.zipFolder('../data/saves',function()
    {
        zip.writeToFile('../data/backups/' + utils.fileTimestamp() + '.zip');
        logger.info("Stats backup done!");
    });
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
