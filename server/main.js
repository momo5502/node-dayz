var server  = require('./server');
var handler = require('./handler');

process.title = "NodeDayZ";

server.useHandler(handler);
server.start(80);
