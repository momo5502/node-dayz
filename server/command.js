var logger = require('./logger');
var utils  = require('./utils');
var backup = require('./backup');
var server = require('./server');
var config = require('../config');

var Cmd_ArgC;
var Cmd_ArgV;
var Cmd_AddCommand;

exports.initialize = function(argC, argV, addCommand)
{
    Cmd_ArgC       = argC;
    Cmd_ArgV       = argV;
    Cmd_AddCommand = addCommand;

    Cmd_AddCommand("exit", Exit_f);           // Terminate the NodeDayZ server
    Cmd_AddCommand("terminate", Terminate_f); // Terminate the servers connected to the hive
    Cmd_AddCommand("synctime", Synctime_f);   // Set the synchronization time between dedis and the hive
    Cmd_AddCommand("backup", Backup_f);       // Initiate a stat backup
    Cmd_AddCommand("whitelist", Whitelist_f); // Whitelist an IP or host
};

// --------------------------------------------------------+

function Exit_f()
{
    process.exit(0);
}

function Terminate_f()
{
    var param = true;

    if(Cmd_ArgC() > 1)
    {
        param = utils.parseBool(Cmd_ArgV(1));
    }

    config.dediConfig.s_shutdown = param;

    logger.info("Server termination: " + (param ? "ENABLED" : "DISABLED"));
}

function Synctime_f()
{
    if(Cmd_ArgC() <= 1 || isNaN(Cmd_ArgV(1)))
    {
        logger.warn("Usage: \"" + Cmd_ArgV(0) + " <seconds>\"");
    }
    else
    {
        config.dediConfig.s_synctime = parseInt(Cmd_ArgV(1));
        logger.info("Hive synchronization time set to " + config.dediConfig.s_synctime + " seconds!");
    }
}

function Backup_f()
{
    backup.run();
}

function Whitelist_f()
{
    if(Cmd_ArgC() <= 2 || isNaN(Cmd_ArgV(2)))
    {
        logger.warn("Usage: \"" + Cmd_ArgV(0) + " <ip/host> <bits>\"");
    }
    else
    {
        var host = Cmd_ArgV(1);
        var bits = parseInt(Cmd_ArgV(2));
        server.whitelist(host, bits);
    }
}
