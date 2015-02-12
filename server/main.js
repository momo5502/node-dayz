var server  = require('./server');
var colors  = require('colors/safe');
var handler = require('./handler');

process.title = "NodeDayZ";

console.log(colors.grey("###############################################################################"));
console.log(colors.grey("#                                                                             #"));
console.log(colors.grey("#            " + colors.green("NodeDayZ Server by momo5502 ( https://momo5502.com )") + "             #"));
console.log(colors.grey("#                                                                             #"));
console.log(colors.grey("###############################################################################\n"));

server.useHandler(handler);
server.start(80);
