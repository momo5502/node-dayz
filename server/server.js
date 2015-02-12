var colors = require('colors/safe');
var http   = require("http");
var url    = require("url");
var fs     = require('fs');

process.title = "NodeDayZ";

// Configure WebServer
var port = 80;

var responseHandlers = [];

function addResponseHandler(path, callback)
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

function respondEmpty(response)
{
  response.writeHead(200);
  response.end();
}

function respondNotFound(response)
{
  response.writeHead(404, {"Content-Type": "text/plain"});
  response.write("Request not supported, faggot.");
  response.end();
}

function parseHTTPData(request, response)
{
  var parsedUrl = url.parse(request.url, true);

  var handler = responseHandlers[parsedUrl.pathname];

  if(handler != null)
  {
    handler(request, response);

    if(!response.finished)
    {
      respondEmpty(response);
    }
  }
  else
  {
    console.warn(colors.yellow("Unhandled request (" + request.method + "): " + request.url));

    request.on("data", function(body)
    {
      console.warn(colors.yellow("Data: " + body));
    });

    respondNotFound(response);
  }
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
  if(fs.existsSync(file)) fs.unlinkSync(file);
  fs.writeFileSync(file, data);
}

// Start server
console.log(colors.cyan("Starting web server on port " + port));

var server;
server = http.createServer(parseHTTPData);
server.listen(port);

// Setup data structure
createDir("../data/saves/");

// Custom stuff

function initializeEnvironment(request, response)
{
  console.log("Environment initalization requested.");

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
  console.log("Ping request handled.");
  sendJsonResponse(response);
}

function logSpawnStats(request, response)
{
  request.on("data", function(body)
  {
    var data = JSON.parse(body);

    console.log("Server spawn (code: " + data.code + ", spawned: " + data.spawned + ", loaded: " + data.loaded + ") handled.");
  });

  sendJsonResponse(response);
}

function sendConfigResponse(response)
{
  var version = [0, 53, 126384];
  //version = [0, 52, 126010];
  //version = [0, 52, 125994];

  var config =
  {
    success          : 1,       // Success?
    current          : 1,       // Current?
    next             : 0,       // ?
    timeout          : 10,      // Timeout?
    type             : "COOP",  // Gametype?

    version_required : version, // Required version
    version_allowed  : version, // Allowed version

    key              : "ZOB",   // Some key?
    check            : 1,       // Key check?
    lowcountp        : 1,       // ?
    mincount         : 1,       // ?

    s_shutdown       : false,   // Shutdown server
    s_savestats      : true,    // Save stats
    s_readrequests   : true,    // Read remote requests
    s_dblog          : true,    // Log database messages
    s_devlog         : true,    // Log development message
    s_qalog          : false,   // Log item spawn messages (might spam and slow everything)
    s_synctime       : 60,      // Setting synchronization time (in seconds)
    s_statstime      : 3,       // Stats request time (in seconds)?
  };

  sendJsonResponse(response, config);
}

function serverStartup(request, response)
{
  console.log("Server startup handled.");
  sendConfigResponse(response);
}

function serverSync(request, response)
{
  console.log("Server sync handled.");
  sendConfigResponse(response);
}

function reportMessage(request, response)
{
  request.on("data", function(body)
  {
    var data = JSON.parse(body);
    console.warn(colors.yellow("Server report:" + data.message));
  });

  sendJsonResponse(response);
}

function handleRequests(request, response)
{
  console.log("Server requests handled.");

  var requests =
  {
    count : 1, // What does it need that count for?
  };

  sendJsonResponse(response, requests);
}

function getGlobalTypes(request, response)
{
  console.log("Global type request handled.");

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
  console.log("Global type saving handled.");

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
    console.warn(colors.yellow("Find player request error: No userid given."));
  }
  else if(isNaN(query.uid))
  {
    console.warn(colors.yellow("Find player request error: Userid is not numerical."));
  }
  else
  {
    var data = "{}";
    var file = "../data/saves/" + query.uid + ".json";

    if(fs.existsSync(file))
    {
      data = fs.readFileSync(file);
    }

    console.log("Find player request handled (uid: " + query.uid + ").");
    sendRawJsonResponse(response, data);
  }
}

function loadPlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    console.warn(colors.yellow("Load player request error: No userid given."));
  }
  else if(isNaN(query.uid))
  {
    console.warn(colors.yellow("Load player request error: Userid is not numerical."));
  }
  else
  {
    var data = "{}";
    var file = "../data/saves/" + query.uid + ".json";

    if(fs.existsSync(file))
    {
      data = fs.readFileSync(file);
    }

    console.log("Load player request handled (uid: " + query.uid + ").");
    sendRawJsonResponse(response, data);
  }
}

function createPlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    console.warn(colors.yellow("Create player request error: No userid given."));
  }
  else if(isNaN(query.uid))
  {
    console.warn(colors.yellow("Create player request error: Userid is not numerical."));
  }
  else
  {
    var data = "{}";
    var file = "../data/saves/" + query.uid + ".json";

    if(!fs.existsSync(file))
    {
      fs.writeFileSync(file, data);
    }

    console.log("Create player request handled (uid: " + query.uid + ").");
    sendJsonResponse(response);
  }
}

function savePlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    console.warn(colors.yellow("Save player request error: No userid given."));
  }
  else if(isNaN(query.uid))
  {
    console.warn(colors.yellow("Save player request error: Userid is not numerical."));
  }
  else
  {
    request.on("data", function(body)
    {
      overwriteFile("../data/saves/" + query.uid + ".json", body);
      console.log("Save player request handled (uid: " + query.uid + ").");
    });

    sendJsonResponse(response);
  }
}

function queuePlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if(query.uid == null)
  {
    console.warn(colors.yellow("Queue player request error: No userid given."));
  }
  else if(isNaN(query.uid))
  {
    console.warn(colors.yellow("Queue player request error: Userid is not numerical."));
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

      console.log("Queue player request handled (uid: " + query.uid + ", queue: " + data.queue + ").");
    });

    sendJsonResponse(response);
  }
}

// Initialization
addResponseHandler("/DayZServlet/init/enviroment/", initializeEnvironment);
addResponseHandler("/DayZServlet/init/spawnstats/", logSpawnStats);
addResponseHandler("/DayZServlet/init/startup/", serverStartup);
addResponseHandler("/DayZServlet/init/sync/", serverSync);
addResponseHandler("/DayZServlet/init/reportmsg/", reportMessage);
addResponseHandler("/DayZServlet/init/requests/", handleRequests);
addResponseHandler("/DayZServlet/init/ping/", pingResponse);

// Types
addResponseHandler("/DayZServlet/w_0ld/global/type/get/", getGlobalTypes);
addResponseHandler("/DayZServlet/w_0ld/global/type/set/", setGlobalTypes);
addResponseHandler("/DayZServlet/w_0ld/globalstat/", setGlobalTypes); // v0.52

// Player commands
addResponseHandler("/DayZServlet/a_0fg/find/", findPlayer);
addResponseHandler("/DayZServlet/a_0fg/load/", loadPlayer);
addResponseHandler("/DayZServlet/a_0fg/create/", createPlayer);
addResponseHandler("/DayZServlet/a_0fg/save/", savePlayer);
addResponseHandler("/DayZServlet/a_0fg/queue/", queuePlayer);
