var clc = require('cli-color');
var server = require('./server');
var handler = require('./handler');
var backup = require('./backup');
var input = require('./input');
var config = require('../config');

process.title = "NodeDayZ";

console.log(clc.blackBright("###############################################################################"));
console.log(clc.blackBright("#                                                                             #"));
console.log(clc.blackBright("#") + "            " + clc.greenBright("NodeDayZ Server by momo5502 ( https://momo5502.com )") + "             " + clc.blackBright("#"));
console.log(clc.blackBright("#                                                                             #"));
console.log(clc.blackBright("###############################################################################\n"));

server.useHandler(handler);
server.start(config.port, config.ip);

input.handle();
