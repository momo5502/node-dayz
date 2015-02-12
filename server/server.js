var url    = require("url");
var http   = require("http");
var logger = require('./logger');

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
    response.write("Request not supported, faggot.");
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
  logger.info("Starting web server on port " + port);

  var server;
  server = http.createServer(parseHTTPData);
  server.listen(port);
}

exports.useHandler = useHandler
exports.start = start;
