var url         = require("url");
var http        = require("http");
var ipaddr      = require('ipaddr.js');
var tcpPortUsed = require('tcp-port-used');
var utils       = require('./utils');
var logger      = require('./logger');
var backup      = require('./backup');
var config      = require('../config');

var server  = null;
var handler = null;
var resolvedList = [];

var whitelist = config.whitelist;

// Whitelist IPs
function isLegalRequest(request)
{
    var ip = utils.getIP(request);

    // Check for validity
    if(ipaddr.isValid(ip))
    {
        var addr = ipaddr.parse(ip);

        // Loop through whitelist
        for(var i = 0; i < whitelist.length; i++)
        {
            // Parse whitelist ip
            var checkIP = whitelist[i][0];
            var bits    = whitelist[i][1];

            if(ipaddr.isValid(checkIP))
            {
                var checkAddr = ipaddr.parse(checkIP);

                if(addr.match(checkAddr, bits))
                {
                    return true;
                }
            }
        }
    }

    return false;
}

function denieRequest(response)
{
    response.writeHead(403, {"Content-Type": "text/plain"});
    response.write("Access denied!");
    response.end();
}

function requestHandler(request, response)
{
    // Check if ip/host is whitelisted
    if(!isLegalRequest(request))
    {
        logger.info("Access denied for: " + utils.getIP(request));
        denieRequest(response);
        return;
    }

    // Call handler if available
    var parsedUrl = url.parse(request.url, true);

    if(handler != null && handler.parse(parsedUrl.pathname, request, response))
    {
        // If response hasn't been finished, finish it.
        if(!response.finished)
        {
            response.writeHead(200);
            response.end();
        }
    }
    else
    {
        // Return unhandled requests
        logger.warn("Unhandled request (" + request.method + "): " + request.url);

        request.on("data", function(body)
        {
            logger.warn("Data: " + body);
        });

        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("Request not supported.");
        response.end();
    }
}

// Apply handler
function useHandler(_handler)
{
    handler = _handler;
    handler.setup();
}

function resolveWhitelistHosts()
{
    for(var i = 0; i < whitelist.length; i++)
    {
        utils.resolveHost(whitelist[i][0], function(err, addresses, family, param)
        {
            whitelist[param][0] = addresses;
        }, i);
    }
}

function start(port, ip)
{
    // Resolve IPs from given hosts in the whitelist
    resolveWhitelistHosts();

    // Check if port is free
    tcpPortUsed.check(port, "127.0.0.1").then(function(inUse)
    {
        if(inUse)
        {
            logger.error("Port " + port + " already in use!");
        }
        else
        {
            // Start webserver
            server = http.createServer(requestHandler);
            server.listen(port, ip);
            backup.start();
            logger.info("Server started on port " + port);
        }
    }, function(err)
    {
        logger.error("Port check failed: " + err.message);
    });
}

exports.useHandler = useHandler
exports.start      = start;
