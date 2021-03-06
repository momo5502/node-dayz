var fs = require('fs');
var url = require('url');
var logger = require('./logger');
var utils = require('./utils');
var config = require(global.configFile);

var initialized = false;
var responseHandlers = [];

function NET_RegisterHandler(path, callback)
{
  responseHandlers[path] = callback;
}

function NET_SendRawJsonResponse(response, responseBody)
{
  response.writeHead(200,
  {
    "Content-Type": "application/json"
  });
  response.write(responseBody);
  response.end();
}

function NET_SendJsonResponse(response, data)
{
  var responseBody = "{}";

  if (data != null)
  {
    responseBody = JSON.stringify(data);
  }

  NET_SendRawJsonResponse(response, responseBody);
}

function LiveStats_GetPlayer(uid)
{
  return JSON.stringify(LiveStats_GetPlayerObj(uid));
}

function LiveStats_GetPlayerObj(uid)
{
  var player = {};
  var file = global.configDir + "saves/" + uid + ".json";

  if (uid != null && !isNaN(uid) && fs.existsSync(file))
  {
    player = JSON.parse(fs.readFileSync(file));
    if (player.alive) player.alive = true;
    else player.alive = false;
  }

  return player;
}

function LiveStats_SetPlayer(uid, data)
{
  if (uid != null && !isNaN(uid))
  {
    utils.overwriteFile(global.configDir + "saves/" + uid + ".json", data);
  }
}

function LiveStats_SetPlayerObj(uid, obj)
{
  LiveStats_SetPlayer(uid, JSON.stringify(obj));
}

function LiveStats_KillPlayer(uid)
{
  var player = LiveStats_GetPlayerObj(uid);
  player.alive = false;
  LiveStats_SetPlayerObj(uid, player);
}

// ----------------------------------------------------------------------------------+
// Handlers

function NET_InitEnvironment(request, response)
{
  logger.log("Environment init request handled.");

  // Resolve requested host
  var host = request.headers.host;
  if (host == null) host = "localhost";

  var environment = {
    envpri: "http://" + host + "/DayZServlet/", // Primary environment synchronization server
    envsec: "http://" + host + "/DayZServlet/" // Secondary environment synchronization server
  };

  NET_SendJsonResponse(response, environment);
}

function NET_PingResponse(request, response)
{
  logger.log("Ping request handled.");
  NET_SendJsonResponse(response);
}

function NET_LogSpawnStats(request, response)
{
  request.on("data", function(body)
  {
    var data = JSON.parse(body);
    logger.log("Server spawn (code: " + data.code + ", spawned: " + data.spawned + ", loaded: " + data.loaded + ") handled.");
  });

  NET_SendJsonResponse(response);
}

function NET_SendConfigResponse(response)
{
  // TODO: Probably reload the config here?
  NET_SendJsonResponse(response, config.dediConfig);
}

function NET_StartServer(request, response)
{
  NET_SendConfigResponse(response);
  logger.log("Server startup handled.");
}

function NET_SyncServer(request, response)
{
  NET_SendConfigResponse(response);
  logger.log("Server sync handled.");
}

function NET_ReportMessage(request, response)
{
  request.on("data", function(body)
  {
    var data = JSON.parse(body);
    logger.warn("Server report:" + data.message);
  });

  NET_SendJsonResponse(response);
}

function NET_HandleRequests(request, response)
{
  NET_SendJsonResponse(response, config.dediRequests);
  logger.log("Server requests handled.");
}

function NET_GetGlobalTypes(request, response)
{
  logger.log("Global type request handled.");

  var types = "{}";

  var file = global.configDir + "type.json";

  if (fs.existsSync(file))
  {
    types = fs.readFileSync(file);
  }

  NET_SendRawJsonResponse(response, types);
}

function NET_SetGlobalTypes(request, response)
{
  logger.log("Global type saving handled.");

  request.on("data", function(body)
  {
    utils.overwriteFile(global.configDir + "type.json", body);
  });

  NET_SendJsonResponse(response);
}

function NET_FindPlayer(request, response)
{
  var query = url.parse(request.url, true).query;
  NET_SendRawJsonResponse(response, LiveStats_GetPlayer(query.uid));
  logger.log("Find player request handled (uid: " + query.uid + ").");
}

function NET_LoadPlayer(request, response)
{
  var query = url.parse(request.url, true).query;
  NET_SendRawJsonResponse(response, LiveStats_GetPlayer(query.uid));
  logger.log("Load player request handled (uid: " + query.uid + ").");
}

function NET_CreatePlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  if (!fs.existsSync(global.configDir + "saves/" + query.uid + ".json"))
  {
    LiveStats_SetPlayer(query.uid, "{}");
  }

  logger.log("Create player request handled (uid: " + query.uid + ").");
  NET_SendJsonResponse(response);
}

function NET_SavePlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  request.on("data", function(body)
  {
    LiveStats_SetPlayer(query.uid, body);
    logger.log("Save player request handled (uid: " + query.uid + ").");
  });

  NET_SendJsonResponse(response);
}

function NET_QueuePlayer(request, response)
{
  var query = url.parse(request.url, true).query;

  request.on("data", function(body)
  {
    var data = JSON.parse(body);
    var player = LiveStats_GetPlayerObj(query.uid);
    player.queue = data.queue; // Spawn delay
    LiveStats_SetPlayerObj(query.uid, player);
    logger.log("Queue player request handled (uid: " + query.uid + ", queue: " + data.queue + ").");
  });

  NET_SendJsonResponse(response);
}

function NET_DestroyPlayer(request, response)
{
  var query = url.parse(request.url, true).query;
  LiveStats_KillPlayer(query.uid);
  NET_SendJsonResponse(response);
  logger.log("Destroy player request handled (uid: " + query.uid + ").");
}

function NET_KillPlayer(request, response)
{
  var query = url.parse(request.url, true).query;
  LiveStats_KillPlayer(query.uid);
  NET_SendJsonResponse(response);
  logger.log("Kill player request handled (uid: " + query.uid + ").");
}

function NET_ParseRoot(request, response)
{
  response.writeHead(418,
  {
    "Content-Type": "text/html"
  });
  response.write("Hi");
  response.end();
}

function NET_RedirectRoot(request, response)
{
  response.writeHead(307,
  {
    "Location": "/"
  });
  response.end();
}

// DayZ favicon :D
function NET_ReturnFavicon(request, response)
{
  response.writeHead(200,
  {
    "Content-Type": "image/x-icon"
  });
  response.write(new Buffer("/9j/4AAQSkZJRgABAQEBKwErAAD/7RSMUGhvdG9zaG9wIDMuMAA4QklNBCUAAAAAABAAAAAAAAAAAAAAAAAAAAAAOEJJTQPtAAAAAAAQASv/2QABAAEBK//ZAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAHjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAjhCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAAAAAAAAAIAADhCSU0EAgAAAAAABgAAAAAAADhCSU0EMAAAAAAAAwEBAQA4QklNBC0AAAAAAAYAAQAAAAU4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADRQAAAAYAAAAAAAAAAAAAAhIAAAISAAAACABkAGEAeQB6AGwAbwBnAG8AAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAhIAAAISAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEAAAAAAABudWxsAAAAAgAAAAZib3VuZHNPYmpjAAAAAQAAAAAAAFJjdDEAAAAEAAAAAFRvcCBsb25nAAAAAAAAAABMZWZ0bG9uZwAAAAAAAAAAQnRvbWxvbmcAAAISAAAAAFJnaHRsb25nAAACEgAAAAZzbGljZXNWbExzAAAAAU9iamMAAAABAAAAAAAFc2xpY2UAAAASAAAAB3NsaWNlSURsb25nAAAAAAAAAAdncm91cElEbG9uZwAAAAAAAAAGb3JpZ2luZW51bQAAAAxFU2xpY2VPcmlnaW4AAAANYXV0b0dlbmVyYXRlZAAAAABUeXBlZW51bQAAAApFU2xpY2VUeXBlAAAAAEltZyAAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAACEgAAAABSZ2h0bG9uZwAAAhIAAAADdXJsVEVYVAAAAAEAAAAAAABudWxsVEVYVAAAAAEAAAAAAABNc2dlVEVYVAAAAAEAAAAAAAZhbHRUYWdURVhUAAAAAQAAAAAADmNlbGxUZXh0SXNIVE1MYm9vbAEAAAAIY2VsbFRleHRURVhUAAAAAQAAAAAACWhvcnpBbGlnbmVudW0AAAAPRVNsaWNlSG9yekFsaWduAAAAB2RlZmF1bHQAAAAJdmVydEFsaWduZW51bQAAAA9FU2xpY2VWZXJ0QWxpZ24AAAAHZGVmYXVsdAAAAAtiZ0NvbG9yVHlwZWVudW0AAAARRVNsaWNlQkdDb2xvclR5cGUAAAAATm9uZQAAAAl0b3BPdXRzZXRsb25nAAAAAAAAAApsZWZ0T3V0c2V0bG9uZwAAAAAAAAAMYm90dG9tT3V0c2V0bG9uZwAAAAAAAAALcmlnaHRPdXRzZXRsb25nAAAAAAA4QklNBCgAAAAAAAwAAAACP/AAAAAAAAA4QklNBBQAAAAAAAQAAAAFOEJJTQQMAAAAAA6jAAAAAQAAAKAAAACgAAAB4AABLAAAAA6HABgAAf/Y/+AAEEpGSUYAAQIAAEgASAAA/+0ADEFkb2JlX0NNAAH/7gAOQWRvYmUAZIAAAAAB/9sAhAAMCAgICQgMCQkMEQsKCxEVDwwMDxUYExMVExMYEQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQ0LCw0ODRAODhAUDg4OFBQODg4OFBEMDAwMDBERDAwMDAwMEQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCACgAKADASIAAhEBAxEB/90ABAAK/8QBPwAAAQUBAQEBAQEAAAAAAAAAAwABAgQFBgcICQoLAQABBQEBAQEBAQAAAAAAAAABAAIDBAUGBwgJCgsQAAEEAQMCBAIFBwYIBQMMMwEAAhEDBCESMQVBUWETInGBMgYUkaGxQiMkFVLBYjM0coLRQwclklPw4fFjczUWorKDJkSTVGRFwqN0NhfSVeJl8rOEw9N14/NGJ5SkhbSVxNTk9KW1xdXl9VZmdoaWprbG1ub2N0dXZ3eHl6e3x9fn9xEAAgIBAgQEAwQFBgcHBgU1AQACEQMhMRIEQVFhcSITBTKBkRShsUIjwVLR8DMkYuFygpJDUxVjczTxJQYWorKDByY1wtJEk1SjF2RFVTZ0ZeLys4TD03Xj80aUpIW0lcTU5PSltcXV5fVWZnaGlqa2xtbm9ic3R1dnd4eXp7fH/9oADAMBAAIRAxEAPwDypJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJT//Q8qSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSU//0fKkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklP/9LypJJJJT1n1d/xc9S69iY+XRk01V5IlocHktG7Kqdv2t2/Swf/AAapbn/jI9Y/8scb/Nf/AHLv/wDF/gV4f1T6bsGt1DLpOpHqtba4dvz3OcujSU+N2f4kuuBpNfUMVz+wcLGj/ODLP+pWH9Yf8W31j+r+EM7KFV+OH7Huxi9+wRIuu3VV+nRp/OL6AUXBrtHAOGvOvkkp+VyCCQeRpoZH3hd/0b/FB1HqvTMTqP7QqoZmVNuFZY5zmteNze7d3sWX/jG+r1HSPrPbV06h9eJkkOqYGEMFrg192PjO+i9rPVqfsb/Net6S916XhDp3TMPp7Xbxh0V0B3iK2Nq3f9FJT5if8Rzmsk9a92gAGKSJOg4yf++qs7/Eh1aPb1LHJ8Cx4/8AJL2FV83Lrw6Rdb/N+pXW4+HqvbQ139l9jdySnyRn+JHrZb7+oYod4AWEffsauJ+sPQ8voHV7+lZcOsoIixs7XscA+uxk/vNcvpleW/47ulA0dO6wxoBY52Jc784hw9fHb/Vr9PK/7cSU8F9Vfqrk/WXLtx6bmYrKWtLrrQS3e97aaafZ/hLXP9n/ABa60/4kesxp1HGnt7X/APkVvf4mOk+h0HI6m8Oa/NyIZro6uhrqmH/t+7J/zF3PVuoVdL6Xl9RtEsxKX3FsgbtjS8Vgu/Os+gxJT5HV/iT+sJeRdnYbGgSCw2vMz3a6mrb/AJyL/wCMj1qf+UcbbHO2yZ+G1en9AyftXRum5+UWHMy8PHfbZAa5xextjh/V9Wx3sWmkp8d/8ZHrH/ljjf5r/wC5T/8AGQ6mKZ/aVBu3AbPTdt2y3c/1N27ft3/o/T/64vXpCdJT8s5FFmPkW49oiyl7q3g9nNO135ENXet4uPh9YzcTGuGTRRfZXXcBAcGuLdwj2/5qpJKf/9PypJJJJT9D/VDqWKz6s9Iqe7a4YVAJ7aMDf4Lmfr1/jCzukZ2Z0ZuOLMXLwgcbKqe6q6p1rX1esX+9r/Tt+g1nof8AGJdCvjouCxria20hjHwWksaXV13bT7mb6gy1ct/jCybaszBydpjIwXYt9L3uIdssssb6rq3V+t6VltGSzd7PtFNdiSnu/qZ9fej9Ywun9Ksynt6sKWVWMvDt1tlbP0trcj31Wers9T9JZ6q7H1GUt97jHjyvm/6q5bsL6y9LyR/g8qqf6pe1j/8AoOXt1vV7TWWOHtGmvMeCSnP+uuNV1L6z/VOv6TWZV9piDLKG4+XZO7839D712AzaD3hclZex3UMPNLWuOHVksYJ/OyPszP8Az1RarGR1nFposyMlzaKKWl9r3SdrR5Nl3+Ykp6R1osdAI28SFW63iDN6NndOaYfl0W1VuOsPexza3f2bFjdK+sHT+pYjM3BtN1DiWkhu0hzY9Sqxh9zLGy3+wj2dYDXBrnF2whwaRqQDujckpufV36wUdW6Hg9Rc4epk0tdaGggC0foshjf6l7LFn/XrDr6t9UepY24G5lJyaxG4h2P+s7WbfzrGVPq/trlPqj1BuFm9b6CRDcLLsyMRpJ/mLHem+P3WN/Vn/wDX10x6i3Qx3/N/Kkp0fqxhs6P9W+n9PEepRQwWtB0Frx61/wD4NY9cr/jf607G+r1PTWuPqdTtBe06j0aNtj9fzd2Q7H/6a2G9TbvIaOPE6Lyn/GJ1d3U/rNe0OmnBAxKhpA9P+fc2P38l1zklPMqxhY2Vn5dWHjkuuvcGMBOkn95V12n+LjpXq5x6jaCG4xa9jtQCZc2poM+/9M31f/QX/hElPpvSrrMHp+Lh1P8A0WPRXSD4ipoq3f2tm5Z/11+tmX0X6vW3U2hmZkkY+KQZLXO9114/4mkez9y62lSZa047WjVwBA79yvMfr91Y5vWTh1unH6aDS0Dg2kzlP/7c/Qf8Xj1pKeaSSSSU/wD/1PKkkkklPqPQnsf0fpoLtTQ2GgkfQJY+W/nLH/xi47/smDk7tzBZbWGwNC5tb53fS9+xbX1ZxA3oPTmWODt1W+SCAA977R9L93dt/wCoQPrn0rPzOkfZ6Gsutry2PqZUSSai2yrfZ6u3Za19jPVaz1Gf4VJT5tTY6q1lzPpVuDh8QdwXttuTRbYXFuhMiPA6ryR31c6/TkV4DqCy3MDjXV6jAH+kN7936T0/0f8ALXo+LbkMxqGXDbY2qttgEEb2sa2zX+ukpuWPaSTP8FhfW/qVmF0G9tZG7Lc3GG4Ana8OsvdB/kV7N35nqrXFle73auOoHwXJ/wCMZzzT06D+j3X6d90Uf992pKeb6X9YesdMrfj4N/p1XOa59ZaxzS5v0SPUa70v+EfXs9T/AAi9V6bn4fUun43UKztGSzc+vX2PBNd1Uu/NZax7a3f6NeMta5zg1o3OcYAHclepfVetuP8AV/AreP0gZO2CHD1rLns3T7fe1v8AY/P/AJxJTjdYvZ0r/GDj5j3xRlsq9V0wNtjPsVjn/wAmt9frf2F17rAw6gtLTtIHEhcX/jIwwXYOewj6LsexgMkQ519RP9f1bm/9ZXUPyQ+wmNJ0EykpsZGbjYeFfn2nazEYbS7n3DSpgZLN/qXurZ9Ni8be973ue8lz3kuc48knUlekfWzIrf8AVzPrG5hY6lnuENe4vqt/QuP841rP+n6i82SUkxcezKyK8eqN9jg0E8D+U7+S1ew9C6M/pfSMbDIIv2iy6QGu3uH0HNH+gq2Vf8Z6i86+omP0+76yY326S2smyiuJa+1n6Wptxn2VN2eo7/SbPR/wq9iHUcZ9vqWMFryZPu2z+CSnnOtZ1vROi29RdDbWtjGY/QusfY+mrT/gnMsyfT/ProXkBJcS5xknUk8krtP8ZPWG3ZWP0Si19tPTw99rrHmx3q3PfkCh1n+E+w02tx6/z6/0tS4tJSkkkklP/9XypJJJJT6n0XK9bpHTiHPtttrrreHTMhrt7ju93trpds/f/Q/mIfT+vYvUcnNxq/acN5FdjXB7LKp2MuY9v7zvzP5a83Zn51YDWZFrQ0tcA17hBYA2s6H/AAbWt2KbOo5NNtltNhD7zNri1pJJ9x5Dvz0lPefWLKpwndM6q6Xtw8pzbQyC4suZFm2dvu247vpK43qWLbTiZNMmrLktLyQ9u395nu+i/wBj/cvN7+o5N7SLHky4OAGgDgANwj+r9FCfl5L3mx9jnudG4uMzADYdP8lu1JT6pbk41NzXX2NY1zYa5zgJdv8Aa1n8rVYP15Y6/Aa1rW/qkZD3F3u22u+y7WN27Xe9tbv5xcTkXutudbuLnP1c46Ek/S03O/OTVXOYHgk7XsLDpOn0gNf5bUlN04GOzpuH1I+oarbrMfJYCJDmBljLanf8LXd7K7G/zmNb7/8AR+k2316N9QOLHsbM9t2zdt/sry0ZtrcV2I1x9B5D31wIL26Ns/e+j7VOzqeVbWKrHbmAR2B4A+l/ZSU9J9eci3e3Fa7diltN2jA6HzlVa5G793f7Pz/+tLRZ1DKbXa19rLcoPFLG+nsb6jj+gd7bPdVfXZVd+Z6dXqrgJBAkmRp5K2OpZgc2xt59SsAMPhG8Tx9Jvqv9P9zekp6HqXXsXqXS+rUMbow1Px3EfSYH01PfH0mu3N3f8XYuSRRk2NqspBiu0y4fAh3P9lCSU9Z9TbukDNYHUtqyascluTZZtJt3P9T0mueKv0uNf6f0PYzF/wCMXbi1gIIOoMxpC8cJntC0KevdVpqZXXlWNbWA1rdCA0aNb7v3UlPbZX1a+rbrX35FdpfYXWW2utdE/Tsstd+Z+c/euafm/U6nJyWM6bdkUBu3GsNzm73CNznM9r6q3O/mnfzmz+dp/SfosrJ6rnZNbqrrnPa8gukATGv5o/eVNJTKwVix4rJdWHHY4iCWz7SQopJJKf/W8qSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSU//1/KkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklP/9DypJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJT//ZADhCSU0EIQAAAAAAVQAAAAEBAAAADwBBAGQAbwBiAGUAIABQAGgAbwB0AG8AcwBoAG8AcAAAABMAQQBkAG8AYgBlACAAUABoAG8AdABvAHMAaABvAHAAIABDAFMANAAAAAEAOEJJTQQGAAAAAAAHAAgAAAABAQD/4Q+9RXhpZgAATU0AKgAAAAgABwESAAMAAAABAAEAAAEaAAUAAAABAAAAYgEbAAUAAAABAAAAagEoAAMAAAABAAIAAAExAAIAAAAcAAAAcgEyAAIAAAAUAAAAjodpAAQAAAABAAAApAAAANAAAAEsAAAAAQAAASwAAAABQWRvYmUgUGhvdG9zaG9wIENTNCBXaW5kb3dzADIwMTI6MDU6MTMgMTc6Mjk6NDYAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACEqADAAQAAAABAAACEgAAAAAAAAAGAQMAAwAAAAEABgAAARoABQAAAAEAAAEeARsABQAAAAEAAAEmASgAAwAAAAEAAgAAAgEABAAAAAEAAAEuAgIABAAAAAEAAA6HAAAAAAAAASwAAAABAAABLAAAAAH/2P/gABBKRklGAAECAABIAEgAAP/tAAxBZG9iZV9DTQAB/+4ADkFkb2JlAGSAAAAAAf/bAIQADAgICAkIDAkJDBELCgsRFQ8MDA8VGBMTFRMTGBEMDAwMDAwRDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAENCwsNDg0QDg4QFA4ODhQUDg4ODhQRDAwMDAwREQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM/8AAEQgAoACgAwEiAAIRAQMRAf/dAAQACv/EAT8AAAEFAQEBAQEBAAAAAAAAAAMAAQIEBQYHCAkKCwEAAQUBAQEBAQEAAAAAAAAAAQACAwQFBgcICQoLEAABBAEDAgQCBQcGCAUDDDMBAAIRAwQhEjEFQVFhEyJxgTIGFJGhsUIjJBVSwWIzNHKC0UMHJZJT8OHxY3M1FqKygyZEk1RkRcKjdDYX0lXiZfKzhMPTdePzRieUpIW0lcTU5PSltcXV5fVWZnaGlqa2xtbm9jdHV2d3h5ent8fX5/cRAAICAQIEBAMEBQYHBwYFNQEAAhEDITESBEFRYXEiEwUygZEUobFCI8FS0fAzJGLhcoKSQ1MVY3M08SUGFqKygwcmNcLSRJNUoxdkRVU2dGXi8rOEw9N14/NGlKSFtJXE1OT0pbXF1eX1VmZ2hpamtsbW5vYnN0dXZ3eHl6e3x//aAAwDAQACEQMRAD8A8qSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSU//0PKkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklP/9HypJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJT//S8qSSSSU9Z9Xf8XPUuvYmPl0ZNNVeSJaHB5LRuyqnb9rdv0sH/wAGqW5/4yPWP/LHG/zX/wBy7/8Axf4FeH9U+m7BrdQy6TqR6rW2uHb89znLo0lPjdn+JLrgaTX1DFc/sHCxo/zgyz/qVh/WH/Ft9Y/q/hDOyhVfjh+x7sYvfsESLrt1Vfp0afzi+gFFwa7RwDhrzr5JKflcggkHkaaGR94Xf9G/xQdR6r0zE6j+0KqGZlTbhWWOc5rXjc3u3d7Fl/4xvq9R0j6z21dOofXiZJDqmBhDBa4Nfdj4zvovaz1an7G/zXrekvdel4Q6d0zD6e128YdFdAd4itjat3/RSU+Yn/Ec5rJPWvdoABikiToOMn/vqrO/xIdWj29SxyfAseP/ACS9hVfNy68OkXW/zfqV1uPh6r20Nd/ZfY3ckp8kZ/iR62W+/qGKHeAFhH37GrifrD0PL6B1e/pWXDrKCIsbO17HAPrsZP7zXL6ZXlv+O7pQNHTusMaAWOdiXO/OIcPXx2/1a/Tyv+3ElPBfVX6q5P1ly7cem5mKylrS660Et3ve2mmn2f4S1z/Z/wAWutP+JHrMadRxp7e1/wD5Fb3+JjpPodByOpvDmvzciGa6Oroa6ph/7fuyf8xdz1bqFXS+l5fUbRLMSl9xbIG7Y0vFYLvzrPoMSU+R1f4k/rCXkXZ2GxoEgsNrzM92upq2/wCci/8AjI9an/lHG2xztsmfhtXp/QMn7V0bpuflFhzMvDx322QGucXsbY4f1fVsd7FppKfHf/GR6x/5Y43+a/8AuU//ABkOpimf2lQbtwGz03bdst3P9Tdu37d/6P0/+uL16QnSU/LORRZj5FuPaIspe6t4PZzTtd+RDV3reLj4fWM3Exrhk0UX2V13AQHBri3cI9v+aqSSn//T8qSSSSU/Q/1Q6lis+rPSKnu2uGFQCe2jA3+C5n69f4ws7pGdmdGbjizFy8IHGyqnuquqda19XrF/va/07foNZ6H/ABiXQr46Lgsa4mttIYx8FpLGl1dd20+5m+oMtXLf4wsm2rMwcnaYyMF2LfS97iHbLLLG+q6t1frelZbRks3ez7RTXYkp7v6mfX3o/WMLp/SrMp7erCllVjLw7dbZWz9La3I99Vnq7PU/SWequx9RlLfe4x48r5v+quW7C+svS8kf4PKqn+qXtY//AKDl7db1e01ljh7RprzHgkpz/rrjVdS+s/1Tr+k1mVfaYgyyhuPl2Tu/N/Q+9dgM2g94XJWXsd1DDzS1rjh1ZLGCfzsj7Mz/AM9UWqxkdZxaaLMjJc2iilpfa90na0eTZd/mJKekdaLHQCNvEhVut4gzejZ3TmmH5dFtVbjrD3sc2t39mxY3SvrB0/qWIzNwbTdQ4lpIbtIc2PUqsYfcyxst/sI9nWA1wa5xdsIcGkakA7o3JKbn1d+sFHVuh4PUXOHqZNLXWhoIAtH6LIY3+peyxZ/16w6+rfVHqWNuBuZScmsRuIdj/rO1m386xlT6v7a5T6o9QbhZvW+gkQ3Cy7MjEaSf5ix3pvj91jf1Z/8A19dMeot0Md/zfypKdH6sYbOj/Vvp/TxHqUUMFrQdBa8etf8A+DWPXK/43+tOxvq9T01rj6nU7QXtOo9GjbY/X83dkOx/+mthvU27yGjjxOi8p/xidXd1P6zXtDppwQMSoaQPT/n3Nj9/Jdc5JTzKsYWNlZ+XVh45Lrr3BjATpJ/eVddp/i46V6uceo2ghuMWvY7UAmXNqaDPv/TN9X/0F/4RJT6b0q6zB6fi4dT/ANFj0V0g+IqaKt39rZuWf9dfrZl9F+r1t1NoZmZJGPikGS1zvddeP+JpHs/cutpUmWtOO1o1cAQO/crzH6/dWOb1k4dbpx+mg0tA4NpM5T/+3P0H/F49aSnmkkkklP8A/9TypJJJJT6j0J7H9H6aC7U0NhoJH0CWPlv5yx/8YuO/7Jg5O7cwWW1hsDQubW+d30vfsW19WcQN6D05ljg7dVvkggAPe+0fS/d3bf8AqED659Kz8zpH2ehrLra8tj6mVEkmotsq32ert2WtfYz1Ws9Rn+FSU+bU2OqtZcz6Vbg4fEHcF7bbk0W2FxboTIjwOq8kd9XOv05FeA6gstzA411eowB/pDe/d+k9P9H/AC16Pi25DMahlw22NqrbYBBG9rGts1/rpKblj2kkz/BYX1v6lZhdBvbWRuy3NxhuAJ2vDrL3Qf5Fezd+Z6q1xZXu92rjqB8Fyf8AjGc809Og/o91+nfdFH/fdqSnm+l/WHrHTK34+Df6dVzmufWWsc0ub9Ej1Gu9L/hH17PU/wAIvVem5+H1Lp+N1Cs7Rks3Pr19jwTXdVLvzWWse2t3+jXjLWuc4NaNznGAB3JXqX1Xrbj/AFfwK3j9IGTtghw9ay57N0+33tb/AGPz/wCcSU43WL2dK/xg4+Y98UZbKvVdMDbYz7FY5/8AJrfX639hde6wMOoLS07SBxIXF/4yMMF2DnsI+i7HsYDJEOdfUT/X9W5v/WV1D8kPsJjSdBMpKbGRm42HhX59p2sxGG0u59w0qYGSzf6l7q2fTYvG3ve97nvJc95LnOPJJ1JXpH1syK3/AFcz6xuYWOpZ7hDXuL6rf0Lj/ONaz/p+ovNklJMXHsysivHqjfY4NBPA/lO/ktXsPQujP6X0jGwyCL9osukBrt7h9BzR/oKtlX/GeovOvqJj9Pu+smN9uktrJsoriWvtZ+lqbcZ9lTdnqO/0mz0f8KvYh1HGfb6ljBa8mT7ts/gkp5zrWdb0TotvUXQ21rYxmP0LrH2Ppq0/4JzLMn0/z66F5ASXEucZJ1JPJK7T/GT1ht2Vj9EotfbT08Pfa6x5sd6tz35AodZ/hPsNNrcev8+v9LUuLSUpJJJJT//V8qSSSSU+p9FyvW6R04hz7bba663h0zIa7e47vd7a6XbP3/0P5iH0/r2L1HJzcav2nDeRXY1weyyqdjLmPb+878z+WvN2Z+dWA1mRa0NLXANe4QWANrOh/wAG1rdimzqOTTbZbTYQ+8za4taSSfceQ789JT3n1iyqcJ3TOqul7cPKc20MguLLmRZtnb7tuO76SuN6li204mTTJqy5LS8kPbt/eZ7vov8AY/3Lze/qOTe0ix5MuDgBoA4ADcI/q/RQn5eS95sfY57nRuLjMwA2HT/JbtSU+qW5ONTc119jWNc2Guc4CXb/AGtZ/K1WD9eWOvwGta1v6pGQ9xd7ttrvsu1jdu13vbW7+cXE5F7rbnW7i5z9XOOhJP0tNzvzk1VzmB4JO17Cw6Tp9IDX+W1JTdOBjs6bh9SPqGq26zHyWAiQ5gZYy2p3/C13eyuxv85jW+//AEfpNt9ejfUDix7GzPbds3bf7K8tGba3FdiNcfQeQ99cCC9ujbP3vo+1Ts6nlW1iqx25gEdgeAPpf2UlPSfXnIt3txWu3YpbTdowOh85VWuRu/d3+z8//rS0WdQym12tfay3KDxSxvp7G+o4/oHe2z3VX12VXfmenV6q4CQQJJkaeStjqWYHNsbefUrADD4RvE8fSb6r/T/c3pKeh6l17F6l0vq1DG6MNT8dxH0mB9NT3x9Jrtzd3/F2LkkUZNjarKQYrtMuHwIdz/ZQklPWfU27pAzWB1LasmrHJbk2WbSbdz/U9Jrnir9LjX+n9D2Mxf8AjF24tYCCDqDMaQvHCZ7QtCnr3VaamV15VjW1gNa3QgNGjW+791JT22V9Wvq2619+RXaX2F1ltrrXRP07LLXfmfnP3rmn5v1OpycljOm3ZFAbtxrDc5u9wjc5zPa+qtzv5p385s/naf0n6LKyeq52TW6q65z2vILpAExr+aP3lTSUysFYseKyXVhx2OIgls+0kKKSSSn/1vKkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklP/9fypJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJT//Q8qSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSUpJJJJSkkkklKSSSSU//2f/iDFhJQ0NfUFJPRklMRQABAQAADEhMaW5vAhAAAG1udHJSR0IgWFlaIAfOAAIACQAGADEAAGFjc3BNU0ZUAAAAAElFQyBzUkdCAAAAAAAAAAAAAAABAAD21gABAAAAANMtSFAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEWNwcnQAAAFQAAAAM2Rlc2MAAAGEAAAAbHd0cHQAAAHwAAAAFGJrcHQAAAIEAAAAFHJYWVoAAAIYAAAAFGdYWVoAAAIsAAAAFGJYWVoAAAJAAAAAFGRtbmQAAAJUAAAAcGRtZGQAAALEAAAAiHZ1ZWQAAANMAAAAhnZpZXcAAAPUAAAAJGx1bWkAAAP4AAAAFG1lYXMAAAQMAAAAJHRlY2gAAAQwAAAADHJUUkMAAAQ8AAAIDGdUUkMAAAQ8AAAIDGJUUkMAAAQ8AAAIDHRleHQAAAAAQ29weXJpZ2h0IChjKSAxOTk4IEhld2xldHQtUGFja2FyZCBDb21wYW55AABkZXNjAAAAAAAAABJzUkdCIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAAEnNSR0IgSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYWVogAAAAAAAA81EAAQAAAAEWzFhZWiAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAG+iAAA49QAAA5BYWVogAAAAAAAAYpkAALeFAAAY2lhZWiAAAAAAAAAkoAAAD4QAALbPZGVzYwAAAAAAAAAWSUVDIGh0dHA6Ly93d3cuaWVjLmNoAAAAAAAAAAAAAAAWSUVDIGh0dHA6Ly93d3cuaWVjLmNoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGRlc2MAAAAAAAAALklFQyA2MTk2Ni0yLjEgRGVmYXVsdCBSR0IgY29sb3VyIHNwYWNlIC0gc1JHQgAAAAAAAAAAAAAALklFQyA2MTk2Ni0yLjEgRGVmYXVsdCBSR0IgY29sb3VyIHNwYWNlIC0gc1JHQgAAAAAAAAAAAAAAAAAAAAAAAAAAAABkZXNjAAAAAAAAACxSZWZlcmVuY2UgVmlld2luZyBDb25kaXRpb24gaW4gSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAAsUmVmZXJlbmNlIFZpZXdpbmcgQ29uZGl0aW9uIGluIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdmlldwAAAAAAE6T+ABRfLgAQzxQAA+3MAAQTCwADXJ4AAAABWFlaIAAAAAAATAlWAFAAAABXH+dtZWFzAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAACjwAAAAJzaWcgAAAAAENSVCBjdXJ2AAAAAAAABAAAAAAFAAoADwAUABkAHgAjACgALQAyADcAOwBAAEUASgBPAFQAWQBeAGMAaABtAHIAdwB8AIEAhgCLAJAAlQCaAJ8ApACpAK4AsgC3ALwAwQDGAMsA0ADVANsA4ADlAOsA8AD2APsBAQEHAQ0BEwEZAR8BJQErATIBOAE+AUUBTAFSAVkBYAFnAW4BdQF8AYMBiwGSAZoBoQGpAbEBuQHBAckB0QHZAeEB6QHyAfoCAwIMAhQCHQImAi8COAJBAksCVAJdAmcCcQJ6AoQCjgKYAqICrAK2AsECywLVAuAC6wL1AwADCwMWAyEDLQM4A0MDTwNaA2YDcgN+A4oDlgOiA64DugPHA9MD4APsA/kEBgQTBCAELQQ7BEgEVQRjBHEEfgSMBJoEqAS2BMQE0wThBPAE/gUNBRwFKwU6BUkFWAVnBXcFhgWWBaYFtQXFBdUF5QX2BgYGFgYnBjcGSAZZBmoGewaMBp0GrwbABtEG4wb1BwcHGQcrBz0HTwdhB3QHhgeZB6wHvwfSB+UH+AgLCB8IMghGCFoIbgiCCJYIqgi+CNII5wj7CRAJJQk6CU8JZAl5CY8JpAm6Cc8J5Qn7ChEKJwo9ClQKagqBCpgKrgrFCtwK8wsLCyILOQtRC2kLgAuYC7ALyAvhC/kMEgwqDEMMXAx1DI4MpwzADNkM8w0NDSYNQA1aDXQNjg2pDcMN3g34DhMOLg5JDmQOfw6bDrYO0g7uDwkPJQ9BD14Peg+WD7MPzw/sEAkQJhBDEGEQfhCbELkQ1xD1ERMRMRFPEW0RjBGqEckR6BIHEiYSRRJkEoQSoxLDEuMTAxMjE0MTYxODE6QTxRPlFAYUJxRJFGoUixStFM4U8BUSFTQVVhV4FZsVvRXgFgMWJhZJFmwWjxayFtYW+hcdF0EXZReJF64X0hf3GBsYQBhlGIoYrxjVGPoZIBlFGWsZkRm3Gd0aBBoqGlEadxqeGsUa7BsUGzsbYxuKG7Ib2hwCHCocUhx7HKMczBz1HR4dRx1wHZkdwx3sHhYeQB5qHpQevh7pHxMfPh9pH5Qfvx/qIBUgQSBsIJggxCDwIRwhSCF1IaEhziH7IiciVSKCIq8i3SMKIzgjZiOUI8Ij8CQfJE0kfCSrJNolCSU4JWgllyXHJfcmJyZXJocmtyboJxgnSSd6J6sn3CgNKD8ocSiiKNQpBik4KWspnSnQKgIqNSpoKpsqzysCKzYraSudK9EsBSw5LG4soizXLQwtQS12Last4S4WLkwugi63Lu4vJC9aL5Evxy/+MDUwbDCkMNsxEjFKMYIxujHyMioyYzKbMtQzDTNGM38zuDPxNCs0ZTSeNNg1EzVNNYc1wjX9Njc2cjauNuk3JDdgN5w31zgUOFA4jDjIOQU5Qjl/Obw5+To2OnQ6sjrvOy07azuqO+g8JzxlPKQ84z0iPWE9oT3gPiA+YD6gPuA/IT9hP6I/4kAjQGRApkDnQSlBakGsQe5CMEJyQrVC90M6Q31DwEQDREdEikTORRJFVUWaRd5GIkZnRqtG8Ec1R3tHwEgFSEtIkUjXSR1JY0mpSfBKN0p9SsRLDEtTS5pL4kwqTHJMuk0CTUpNk03cTiVObk63TwBPSU+TT91QJ1BxULtRBlFQUZtR5lIxUnxSx1MTU19TqlP2VEJUj1TbVShVdVXCVg9WXFapVvdXRFeSV+BYL1h9WMtZGllpWbhaB1pWWqZa9VtFW5Vb5Vw1XIZc1l0nXXhdyV4aXmxevV8PX2Ffs2AFYFdgqmD8YU9homH1YklinGLwY0Njl2PrZEBklGTpZT1lkmXnZj1mkmboZz1nk2fpaD9olmjsaUNpmmnxakhqn2r3a09rp2v/bFdsr20IbWBtuW4SbmtuxG8eb3hv0XArcIZw4HE6cZVx8HJLcqZzAXNdc7h0FHRwdMx1KHWFdeF2Pnabdvh3VnezeBF4bnjMeSp5iXnnekZ6pXsEe2N7wnwhfIF84X1BfaF+AX5ifsJ/I3+Ef+WAR4CogQqBa4HNgjCCkoL0g1eDuoQdhICE44VHhauGDoZyhteHO4efiASIaYjOiTOJmYn+imSKyoswi5aL/IxjjMqNMY2Yjf+OZo7OjzaPnpAGkG6Q1pE/kaiSEZJ6kuOTTZO2lCCUipT0lV+VyZY0lp+XCpd1l+CYTJi4mSSZkJn8mmia1ZtCm6+cHJyJnPedZJ3SnkCerp8dn4uf+qBpoNihR6G2oiailqMGo3aj5qRWpMelOKWpphqmi6b9p26n4KhSqMSpN6mpqhyqj6sCq3Wr6axcrNCtRK24ri2uoa8Wr4uwALB1sOqxYLHWskuywrM4s660JbSctRO1irYBtnm28Ldot+C4WbjRuUq5wro7urW7LrunvCG8m70VvY++Cr6Evv+/er/1wHDA7MFnwePCX8Lbw1jD1MRRxM7FS8XIxkbGw8dBx7/IPci8yTrJuco4yrfLNsu2zDXMtc01zbXONs62zzfPuNA50LrRPNG+0j/SwdNE08bUSdTL1U7V0dZV1tjXXNfg2GTY6Nls2fHadtr724DcBdyK3RDdlt4c3qLfKd+v4DbgveFE4cziU+Lb42Pj6+Rz5PzlhOYN5pbnH+ep6DLovOlG6dDqW+rl63Dr++yG7RHtnO4o7rTvQO/M8Fjw5fFy8f/yjPMZ86f0NPTC9VD13vZt9vv3ivgZ+Kj5OPnH+lf65/t3/Af8mP0p/br+S/7c/23////hEYJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDQuMi4yLWMwNjMgNTMuMzUyNjI0LCAyMDA4LzA3LzMwLTE4OjEyOjE4ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzQgV2luZG93cyIgeG1wOkNyZWF0ZURhdGU9IjIwMTItMDUtMTNUMTY6MDM6NTItMDU6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDEyLTA1LTEzVDE3OjI5OjQ2LTA1OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDEyLTA1LTEzVDE3OjI5OjQ2LTA1OjAwIiBkYzpmb3JtYXQ9ImltYWdlL2pwZWciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxNkQzQTgyNDRCOURFMTExQjNEOEYyMkRFQzZFNUUzNSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3MDY5QjYxNTQ3OURFMTExQjNEOEYyMkRFQzZFNUUzNSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjcwNjlCNjE1NDc5REUxMTFCM0Q4RjIyREVDNkU1RTM1IiB0aWZmOk9yaWVudGF0aW9uPSIxIiB0aWZmOlhSZXNvbHV0aW9uPSIyOTk5OTk0LzEwMDAwIiB0aWZmOllSZXNvbHV0aW9uPSIyOTk5OTk0LzEwMDAwIiB0aWZmOlJlc29sdXRpb25Vbml0PSIyIiB0aWZmOk5hdGl2ZURpZ2VzdD0iMjU2LDI1NywyNTgsMjU5LDI2MiwyNzQsMjc3LDI4NCw1MzAsNTMxLDI4MiwyODMsMjk2LDMwMSwzMTgsMzE5LDUyOSw1MzIsMzA2LDI3MCwyNzEsMjcyLDMwNSwzMTUsMzM0MzI7MTE3RUU2NDdGMEJDRjAxOUY5RTg0MDFEMkE4RkFEREUiIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSI1MzAiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI1MzAiIGV4aWY6Q29sb3JTcGFjZT0iMSIgZXhpZjpOYXRpdmVEaWdlc3Q9IjM2ODY0LDQwOTYwLDQwOTYxLDM3MTIxLDM3MTIyLDQwOTYyLDQwOTYzLDM3NTEwLDQwOTY0LDM2ODY3LDM2ODY4LDMzNDM0LDMzNDM3LDM0ODUwLDM0ODUyLDM0ODU1LDM0ODU2LDM3Mzc3LDM3Mzc4LDM3Mzc5LDM3MzgwLDM3MzgxLDM3MzgyLDM3MzgzLDM3Mzg0LDM3Mzg1LDM3Mzg2LDM3Mzk2LDQxNDgzLDQxNDg0LDQxNDg2LDQxNDg3LDQxNDg4LDQxNDkyLDQxNDkzLDQxNDk1LDQxNzI4LDQxNzI5LDQxNzMwLDQxOTg1LDQxOTg2LDQxOTg3LDQxOTg4LDQxOTg5LDQxOTkwLDQxOTkxLDQxOTkyLDQxOTkzLDQxOTk0LDQxOTk1LDQxOTk2LDQyMDE2LDAsMiw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwyMCwyMiwyMywyNCwyNSwyNiwyNywyOCwzMDsxQ0EwOUYyQjNBOUFCNDg2OTUwQTFDQUIwQzU5Mjc4RiI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NzA2OUI2MTU0NzlERTExMUIzRDhGMjJERUM2RTVFMzUiIHN0RXZ0OndoZW49IjIwMTItMDUtMTNUMTc6Mjk6NDYtMDU6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDUzQgV2luZG93cyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGltYWdlL3BuZyB0byBpbWFnZS9qcGVnIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoxNkQzQTgyNDRCOURFMTExQjNEOEYyMkRFQzZFNUUzNSIgc3RFdnQ6d2hlbj0iMjAxMi0wNS0xM1QxNzoyOTo0Ni0wNTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENTNCBXaW5kb3dzIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/9sAQwABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQECAgEBAgEBAQICAgICAgICAgECAgICAgICAgIC/8AACwgAMAAwAQERAP/EAB0AAAIBBQEBAAAAAAAAAAAAAAAFCQIGBwgKAQv/xAAuEAAABgICAQMBBwUAAAAAAAABAgMEBQYHCAAREgkTITEKFBUiQVGRFiNx8PH/2gAIAQEAAD8A+f8A8OHDhw4xioeWnXqcdCxkhLyCpTGSYxbJ1IPFCkDs5k2rNI6hwABDsQKPX68YzdQtdbIkpYazYIIi4iCB5mFk4oqwlEAEEjP2qYKiAiHfj3y4WGJMpysOnYYzG9+kYFZNBVKaY0yzPIhRNyAmbKJybaKMgcigAIkEFBA/X5RHiBanWxtMNK84rNhQnn6RF2MKtCSiUu8RVKqdNVrGHaAu4SMVFYSmImYogkYQEQKPTcmLslKCcqePruoZJQUVCkqNiOKapSlOZI4FjfyKAQxREo/PRgHroeIZ6r2SrLtmtlgJuvuXjYHrRvORMhELOmhlFESum6Ui2SMu3FVJUoKEASCZMxQN2UQDo9+ymZIomJfVAmL7fWDh81hNXcvlrpmpUzrsrRI2DHMe0cplUVJ15xi8u3E35xTB6KhSCYoc7BMUeqFqN66Wg+6+Gcv4eDH8/Atr7iuaxpcHlduRmVnsEJdHuGr/AI4tQl/u2GLcwzFb8QPHxziPnY0x2qB2okE0pOqOVsN4E1EwvrbSLtWQsWu+sGKMdAgpLRy6pZqAxozrFcfOmDWQOds1k7XBSftLuSJIuTtnJEhMKSnt6NTj/T/afdT09/Veez9ery2C9bc3MJos2RkaUF9kSu181LO5cFUMJEagpM5+TcAcRM3XkynSADAYoQ46F/af90Nvd63WvlSwhgCU18fZQyldXGQZtlkthkit66x9rm5CBK+csroEV/UydcfVKHYKHiyofeF0vvSSpjKK8gg+1F761Hdff6CrlMrrSOY6wYva4anrAlIO3y1gur6ekbvbWBfcMVFCPhpGcJFkAiXunds351VTpi3SQ0h9FO+ULGm385cskXKLpFXhcHZAfOpKWcMG6D07CVqMkEYgEg4TB07FFkuuRuiJnDgGBkkCioYBCYLRtbDumOYtqPY2hxRN1LP5KLlarRRXzWrtmtfl5HKU7Hgd9LzKyAyUewfnZOW5gRcIgsg4VRKmsUvMKQueZBf1qjZkr+c663wVD0qDYuZmPv0MrRbLWY7B80/YUx24GQOwlSFuZrO6IoskKbZ2zXUT9hyJPK4blvPjynacbgYpp2R0FHExkDcKo4bXSUaqmXqt7u1ntjdtEKRf3pEI4kZOW1uwdeaSChTlM1WATIEBF6FN0w7hjWXbrIaLHGto2csxkYbHMXasqQVMVi4uuQDqRqcbYmM6CQxtYeZBctXj12moqm7RgkUCmTWbnSU5wMxwUxC3ywK2W/1HI9pl5ywSdpsVPn1bMydWRackPxpy5mhjm6Mku5kAXdFcNDOGy6Twiia5vIQLi0phKIGKIgYB7AQ+oCHyAgP6D39B+ocqBQ4D2Bjdh5dD2PYeXYG6/bsBHv8Afv54e4p4gXzP4l78S+Q+Jex7HovfQfIj/PAVDiUCeZvEOxAvfwHfwPx/gA/jlICIfQf9/wC884cOHDhw5//Z", 'base64'));
  response.end();
}

// ----------------------------------------------------------------------------------+
// Exports

function parse(path, request, response)
{
  var callback = responseHandlers[path];

  if (callback != null)
  {
    callback(request, response);
    return true;
  }

  return false;
}

function setup()
{
  if (initialized) return;
  initialized = true;

  utils.createDir(global.configDir);
  utils.createDir(global.configDir + "saves/");

  // Initialization
  NET_RegisterHandler("/DayZServlet/init/enviroment/", NET_InitEnvironment); // It's 'environment', not 'enviroment', Bohemia.
  NET_RegisterHandler("/DayZServlet/init/spawnstats/", NET_LogSpawnStats);
  NET_RegisterHandler("/DayZServlet/init/startup/", NET_StartServer);
  NET_RegisterHandler("/DayZServlet/init/sync/", NET_SyncServer);
  NET_RegisterHandler("/DayZServlet/init/reportmsg/", NET_ReportMessage);
  NET_RegisterHandler("/DayZServlet/init/requests/", NET_HandleRequests);
  NET_RegisterHandler("/DayZServlet/init/ping/", NET_PingResponse);

  // Types
  NET_RegisterHandler("/DayZServlet/w_0ld/global/type/get/", NET_GetGlobalTypes);
  NET_RegisterHandler("/DayZServlet/w_0ld/global/type/set/", NET_SetGlobalTypes);
  NET_RegisterHandler("/DayZServlet/w_0ld/globalstat/", NET_SetGlobalTypes); // v0.52

  // Player commands
  NET_RegisterHandler("/DayZServlet/a_0fg/find/", NET_FindPlayer);
  NET_RegisterHandler("/DayZServlet/a_0fg/load/", NET_LoadPlayer);
  NET_RegisterHandler("/DayZServlet/a_0fg/create/", NET_CreatePlayer);
  NET_RegisterHandler("/DayZServlet/a_0fg/save/", NET_SavePlayer);
  NET_RegisterHandler("/DayZServlet/a_0fg/queue/", NET_QueuePlayer);
  NET_RegisterHandler("/DayZServlet/a_0fg/destroy/", NET_DestroyPlayer);
  NET_RegisterHandler("/DayZServlet/a_0fg/kill/", NET_KillPlayer);

  // Others
  NET_RegisterHandler("/DayZServlet/", NET_RedirectRoot);
  NET_RegisterHandler("/DayZServlet", NET_RedirectRoot);
  NET_RegisterHandler("/favicon.ico", NET_ReturnFavicon);
  NET_RegisterHandler("/", NET_ParseRoot);
}

exports.parse = parse;
exports.setup = setup;
