var fs = require('fs');
var fse = require('fs-extra');
var utils = require("./server/utils");

applyConfigPath();

// Create data directory
utils.createDir(global.configDir);

// Copy config template
if (!fs.existsSync(global.configFile))
{
  fse.copySync(global.configFileTemplate, global.configFile);
}

function applyConfigPath()
{
  var modulepath = module.filename;

  var pos = Math.max(modulepath.lastIndexOf("/"), modulepath.lastIndexOf("\\"));

  if(pos != -1)
  {
    modulepath = modulepath.substring(0, pos + 1);
  }

  global.configDir = process.cwd() + "\\data\\";
  global.configFile = global.configDir + "config.js";
  global.configFileTemplate = modulepath + "config.js";
}
