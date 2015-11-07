var fs = require('fs');
var fse = require('fs-extra');
var utils = require("./server/utils");

applyConfigPath();

// Create data directory
utils.createDir(root.configDir);

// Copy config template
if (!fs.existsSync(root.configFile))
{
  fse.copySync(root.configFileTemplate, root.configFile);
}

function applyConfigPath()
{
  var modulepath = module.filename;

  var pos = Math.max(modulepath.lastIndexOf("/"), modulepath.lastIndexOf("\\"));

  if(pos != -1)
  {
    modulepath = modulepath.substring(0, pos + 1);
  }

  root.configDir = process.cwd() + "\\data\\";
  root.configFile = root.configDir + "config.js";
  root.configFileTemplate = modulepath + "config.js";
}
