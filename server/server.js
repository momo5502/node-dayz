var url         = require("url");
var http        = require("http");
var tcpPortUsed = require('tcp-port-used');
var logger      = require('./logger');

var server  = null;
var handler = null;

function parseHTTPData(request, response)
{
  var parsedUrl = url.parse(request.url, true);

  if(handler != null && handler.parse(parsedUrl.pathname, request, response))
  {
    if(!response.finished)
    {
      response.writeHead(200);
      response.end();
    }
  }
  else
  {
    logger.warn("Unhandled request (" + request.method + "): " + request.url, request);

    request.on("data", function(body)
    {
      logger.warn("Data: " + body);
    });

    response.writeHead(404, {"Content-Type": "text/plain"});
    response.write("Request not supported.");
    response.end();
  }
}

function useHandler(_handler)
{
  handler = _handler;
  handler.setup();
}

function start(port)
{
  tcpPortUsed.check(port, 'localhost').then(function(inUse)
  {
    if(inUse)
    {
      logger.error("Port " + port + " already in use!");
    }
    else
    {
      server = http.createServer(parseHTTPData);
      server.listen(port);
      logger.info("NodeDayZ server started on port " + port);
    }
  }, function(err)
  {
    logger.error("Port check failed: " + err.message);
  });
}

exports.useHandler = useHandler
exports.start = start;
