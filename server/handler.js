var fs     = require('fs');
var url    = require('url');
var logger = require('./logger');

var initialized = false;
var responseHandlers = [];

function registerResponseHandler(path, callback)
{
  responseHandlers[path] = callback;
}

function sendRawJsonResponse(response, responseBody)
{
  response.writeHead(200, {"Content-Type": "application/json"});
  response.write(responseBody);
  response.end();
}

function sendJsonResponse(response, data)
{
  var responseBody = "{}";

  if(data != null)
  {
    responseBody = JSON.stringify(data);
  }

  sendRawJsonResponse(response, responseBody);
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

// ----------------------------------------------------------------------------------+
// Handlers

function initializeEnvironment(request, response)
{
  logger.log("Environment init request handled.", request);

  // Resolve requested host
  var host = request.headers.host;
  if(host == null) host = "localhost";

  var environment =
  {
    envpri: "http://" + host + "/DayZServlet/", // Primary environment synchronization server
    envsec: "http://" + host + "/DayZServlet/"  // Secondary environment synchronization server
  };

  sendJsonResponse(response, environment);
}

function pingResponse(request, response)
{
  logger.log("Ping request handled.", request);
  sendJsonResponse(response);
}

function logSpawnStats(request, response)
{
  request.on("data", function(body)
  {
    var data = JSON.parse(body);

    logger.log("Server spawn (code: " + data.code + ", spawned: " + data.spawned + ", loaded: " + data.loaded + ") handled.", request);
  });

  sendJsonResponse(response);
}

function sendConfigResponse(response)
{
  var version = [0, 53, 126384];

  var config =
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
    s_synctime       : 20,      // Setting synchronization time (in seconds)
    s_statstime      : 0,       // Stats request time (in seconds)?
  };

  sendJsonResponse(response, config);
}

function serverStartup(request, response)
{
  logger.log("Server startup handled.", request);
  sendConfigResponse(response);
}

function serverSync(request, response)
{
  logger.log("Server sync handled.", request);
  sendConfigResponse(response);
}

function reportMessage(request, response)
{
  request.on("data", function(body)
  {
    var data = JSON.parse(body);
    logger.warn("Server report:" + data.message, request);
  });

  sendJsonResponse(response);
}

function handleRequests(request, response)
{
  logger.log("Server requests handled.", request);

  var requests =
  {
    count : 0, // What does it need that count for?
  };

  sendJsonResponse(response, requests);
}

function getGlobalTypes(request, response)
{
  logger.log("Global type request handled.", request);

  var types = "{}";

  var file = "../data/type.json";
  if(fs.existsSync(file))
  {
    types = fs.readFileSync(file);
  }

  sendRawJsonResponse(response, types);
}

function setGlobalTypes(request, response)
{
  logger.log("Global type saving handled.", request);

  request.on("data", function(body)
  {
    overwriteFile("../data/type.json", body);
  });

  sendJsonResponse(response);
}

function findPlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    logger.warn("Find player request error: No userid given.", request);
  }
  else if(isNaN(query.uid))
  {
    logger.warn("Find player request error: Userid is not numerical.", request);
  }
  else
  {
    var player = {};
    var file = "../data/saves/" + query.uid + ".json";

    if(fs.existsSync(file))
    {
      player = JSON.parse(fs.readFileSync(file));
    }

    // Game differs between integers and bools!
    // Good job Bohemia xD
    if(player.alive) player.alive = true;
    else player.alive = false;

    logger.log("Find player request handled (uid: " + query.uid + ").", request);
    sendRawJsonResponse(response, JSON.stringify(player));
  }
}

function loadPlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    logger.warn("Load player request error: No userid given.", request);
  }
  else if(isNaN(query.uid))
  {
    logger.warn("Load player request error: Userid is not numerical.", request);
  }
  else
  {
    var data = "{}";
    var file = "../data/saves/" + query.uid + ".json";

    if(fs.existsSync(file))
    {
      data = fs.readFileSync(file);
    }

    logger.log("Load player request handled (uid: " + query.uid + ").", request);
    sendRawJsonResponse(response, data);
  }
}

function createPlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    logger.warn("Create player request error: No userid given.", request);
  }
  else if(isNaN(query.uid))
  {
    logger.warn("Create player request error: Userid is not numerical.", request);
  }
  else
  {
    var data = "{}";
    var file = "../data/saves/" + query.uid + ".json";

    if(!fs.existsSync(file))
    {
      fs.writeFileSync(file, data);
    }

    logger.log("Create player request handled (uid: " + query.uid + ").", request);
    sendJsonResponse(response);
  }
}

function savePlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    logger.warn("Save player request error: No userid given.", request);
  }
  else if(isNaN(query.uid))
  {
    logger.warn("Save player request error: Userid is not numerical.", request);
  }
  else
  {
    request.on("data", function(body)
    {
      overwriteFile("../data/saves/" + query.uid + ".json", body);
      logger.log("Save player request handled (uid: " + query.uid + ").", request);
    });

    sendJsonResponse(response);
  }
}

function queuePlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    logger.warn("Queue player request error: No userid given.", request);
  }
  else if(isNaN(query.uid))
  {
    logger.warn("Queue player request error: Userid is not numerical.", request);
  }
  else
  {
    request.on("data", function(body)
    {
      var data = JSON.parse(body);

      var player = {};
      var file = "../data/saves/" + query.uid + ".json";

      if(fs.existsSync(file))
      {
        player = JSON.parse(fs.readFileSync(file));
      }

      player.queue = data.queue; // Spawn delay

      overwriteFile(file, JSON.stringify(player));

      logger.log("Queue player request handled (uid: " + query.uid + ", queue: " + data.queue + ").", request);
    });

    sendJsonResponse(response);
  }
}

function destroyPlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    logger.warn("Destroy player request error: No userid given.", request);
  }
  else if(isNaN(query.uid))
  {
    logger.warn("Destroy player request error: Userid is not numerical.", request);
  }
  else
  {
    request.on("data", function(body)
    {
      overwriteFile("../data/saves/" + query.uid + ".json", body);
      logger.log("Destroy player request handled (uid: " + query.uid + ").", request);
    });

    sendJsonResponse(response);
  }
}

function killPlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    logger.warn("Kill player request error: No userid given.", request);
  }
  else if(isNaN(query.uid))
  {
    logger.warn("Kill player request error: Userid is not numerical.", request);
  }
  else
  {
    request.on("data", function(body)
    {
      overwriteFile("../data/saves/" + query.uid + ".json", "");
      logger.log("Kill player request handled (uid: " + query.uid + ").", request);
    });

    sendJsonResponse(response);
  }
}

function parseRoot(request, response)
{
  response.writeHead(200, {"Content-Type": "text/html"});
  response.write("Hi");
  response.end();
}

// ----------------------------------------------------------------------------------+
// Exports

function parse(path, request, response)
{
  var callback = responseHandlers[path];

  if(callback != null)
  {
    callback(request, response);
    return true;
  }

  return false;
}

function setup()
{
  if(initialized) return;
  initialized = true;

  createDir("../data/");
  createDir("../data/saves/");

  // Initialization
  registerResponseHandler("/DayZServlet/init/enviroment/", initializeEnvironment);
  registerResponseHandler("/DayZServlet/init/spawnstats/", logSpawnStats);
  registerResponseHandler("/DayZServlet/init/startup/", serverStartup);
  registerResponseHandler("/DayZServlet/init/sync/", serverSync);
  registerResponseHandler("/DayZServlet/init/reportmsg/", reportMessage);
  registerResponseHandler("/DayZServlet/init/requests/", handleRequests);
  registerResponseHandler("/DayZServlet/init/ping/", pingResponse);

  // Types
  registerResponseHandler("/DayZServlet/w_0ld/global/type/get/", getGlobalTypes);
  registerResponseHandler("/DayZServlet/w_0ld/global/type/set/", setGlobalTypes);
  registerResponseHandler("/DayZServlet/w_0ld/globalstat/", setGlobalTypes); // v0.52

  // Player commands
  registerResponseHandler("/DayZServlet/a_0fg/find/", findPlayer);
  registerResponseHandler("/DayZServlet/a_0fg/load/", loadPlayer);
  registerResponseHandler("/DayZServlet/a_0fg/create/", createPlayer);
  registerResponseHandler("/DayZServlet/a_0fg/save/", savePlayer);
  registerResponseHandler("/DayZServlet/a_0fg/queue/", queuePlayer);
  registerResponseHandler("/DayZServlet/a_0fg/destroy/", destroyPlayer);
  registerResponseHandler("/DayZServlet/a_0fg/kill/", killPlayer);

  // Others
  registerResponseHandler("/", parseRoot);
}

function getHandlers()
{
  return responseHandlers;
}

exports.parse = parse;
exports.setup = setup;
