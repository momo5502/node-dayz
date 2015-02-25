exports.port = 80;              // Server port
exports.ip   = "0.0.0.0"        // Server ip

exports.whitelist =             // IP/Hostname whitelist
[
    //["0.0.0.0"    , 0], // No whitelist
    //["10.0.0.0"   , 16],
    //["192.168.0.0", 24],
    ["localhost"  , 32],
];

// Environment config
var version = [0, 54, 126667];  // DayZ Server version

exports.dediConfig =
{
    success          : 1,       // Success?
    current          : 1,       // Current state
    next             : 1,       // Next state
    timeout          : 5,       // Timeout?
    type             : "COOP",  // Type?

    version_required : version, // Required version
    version_allowed  : version, // Allowed version

    key              : "ZOB",   // Some key?
    check            : 1,       // Key check?
    lowcountp        : 1,       // ?
    mincount         : 1,       // ?

    s_shutdown       : false,   // Shutdown server
    s_savestats      : true,    // Save stats
    s_readrequests   : false,   // Read remote requests and sync types
    s_dblog          : true,    // Log database messages
    s_devlog         : true,    // Log development message
    s_qalog          : false,   // Log item spawn messages (might spam and slow everything)
    s_synctime       : 360,     // Setting synchronization time (in seconds)
    s_statstime      : 3,       // Stats request time (in seconds)?
};

// Dedi request response
exports.dediRequests =
{
    count : 0,                  // Request count?
};

// Stats backup
exports.enableBackups = true;
exports.backupInterval = [30, 'minutes'];
