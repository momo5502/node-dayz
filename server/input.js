var readline = require('readline');
var logger = require('./logger');
var utils = require('./utils');
var command = require('./command');
var config = require(root.configFile);

var rl = null;
var commands = [];
var params = [];

function Cmd_ArgC()
{
  return params.length;
}

function Cmd_ArgV(index)
{
  if (Cmd_ArgC() <= index)
  {
    return "";
  }
  else
  {
    return params[index];
  }
}

function Cmd_ParseParams(line)
{
  line = Cmd_ClearLine(line);
  params = line.split(" ");
}

function Cmd_AddCommand(command, callback)
{
  commands[command.toLowerCase()] = callback;
}

function Cmd_ExecuteSingleCommand(command)
{
  // Parse params
  Cmd_ParseParams(command);

  // Execute command
  Cmd_ParseCommand(Cmd_ArgV(0));
}

function Cmd_ClearLine(line)
{
  line = "" + line;
  line = line.trim();

  while (line.indexOf("  ") != -1)
  {
    line = line.replace("  ", " ");
  }

  return line;
}

function Cmd_ParseCommand(command)
{
  var callback = commands[command.toLowerCase()];

  if (callback != null)
  {
    callback();
  }
}

function Cmd_ParseLine(line)
{
  // Clear the line
  line = Cmd_ClearLine(line);

  // Parse command line
  var cmds = line.split(";");

  for (var i = 0; i < cmds.length; i++)
  {
    Cmd_ExecuteSingleCommand(cmds[i]);
  }
}

function Cmd_AutoComplete(line)
{
  var hits = [];

  if (line.trim() != "")
  {
    for (key in commands)
    {
      if (key.indexOf(line) == 0)
      {
        hits[hits.length] = key;
      }
    }
  }

  return [hits, line];
}

function handle()
{
  rl = readline.createInterface(process.stdin, process.stdout, Cmd_AutoComplete);

  rl.setPrompt("");
  rl.on('line', Cmd_ParseLine);

  command.initialize(exports);
}

exports.handle = handle;
exports.Cmd_ArgC = Cmd_ArgC;
exports.Cmd_ArgV = Cmd_ArgV;
exports.Cmd_AddCommand = Cmd_AddCommand;
