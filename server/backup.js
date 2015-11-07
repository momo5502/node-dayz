var every = require('every-moment');
var easyZip = require('easy-zip');
var logger = require('./logger');
var utils = require('./utils');
var config = require('../config');

var lastHash = "";

// Check if saves have changed and determine whether a backup is needed or not.
function isBackupNeeded()
{
  var files = utils.getFileList(root.configDir + "saves/");

  var hash = "";

  for (var i = 0; i < files.length; i++)
  {
    var file = root.configDir + "saves/" + files[i];
    var md5 = utils.md5File(file);

    hash += md5;
  }

  hash = utils.md5(hash);

  var needed = (lastHash != hash);
  lastHash = hash;

  return needed;
}

// Backup all the stats
function backupStats()
{
  if (isBackupNeeded())
  {
    var zip = new easyZip.EasyZip();

    zip.zipFolder(root.configDir + "saves", function()
    {
      zip.writeToFile(root.configDir + "backups/" + utils.fileTimestamp() + ".zip");
      logger.info("Stats backup done!");
    });
  }
  else
  {
    logger.info("No need to backup stats. Nothing has changed!");
  }
}

// Start backup interval
function start()
{
  if (config.enableBackups)
  {
    utils.createDir(root.configDir);
    utils.createDir(root.configDir + "backups/");

    every(config.backupInterval[0], config.backupInterval[1], backupStats);
  }
}

exports.start = start;
exports.run = backupStats;
