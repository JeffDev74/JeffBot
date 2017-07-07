if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'fs', '../index.js', 'path' ], function( fs, plugin, path ) {
  var TwitchBotRoutes = function(plugin) {
    this.plugin = plugin;
    //this.pluginFolder = app.get('plugin folder');
  };

  TwitchBotRoutes.prototype.GetRequest = function(req, res, next) {
    var that = this;

    var appLog = req.app.get('log');
    __dirname = path.resolve(path.dirname(''));
    // var urlParts = req.url.replace(/^\/|\/$/g, '').split(path.sep);
    // /api/plugin/{item_id}        --> DELETE METHOD: DELETE AN ITEM
    // /api/plugin/{item_id}        --> PUT METHOD: UPDATE/EDIT AN ITEM
    // /api/plugin                  --> POST METHOD: CREATE NEW AN ITEM

    // /api/plugin                  --> GET SHOW ALL ITEMS
    // /api/plugin/{item_id}/edit   --> GET SHOW FOR TO EDIT AN ITEM
    // /api/plugin/{item_id}        --> GET SHOW SPECIFIC ITEM
    // /api/plugin/new              --> GET SHOW FORM TO CREATE A NEW ITEM
    console.log('[' + that.plugin.name + '] received a GET request.');
    // console.log(urlParts);

    // if(urlParts[2] == 'viewers_list') {
    //   console.log("viewers list");
    // } 
    // else {
      return that.GetRequestsHandler(req, res, next);
    // }

    //return res.redirect('/');
  };

  // POST request handlers start
  
  TwitchBotRoutes.prototype.PostRequest = function(req, res, next) {
    var that = this;
    var urlParts = req.url.replace(/^\/|\/$/g, '').split(path.sep);
    var action = urlParts[2]; 
    if(action == null) {
      that.SaveSettings(req, res, next);
    } else {
      return res.status(404).render('404', {
        title: '404 Page not found'
      });
    }

    //return res.redirect('/plugin/twitchbot');
  };

  TwitchBotRoutes.prototype.SaveSettings = function(req, res, next) {
    var that = this;

    // { 
    //   api_key: 'api_key_value',
    //   oath_key: 'aoth_key_value',
    //   bot_name: 'bot_name_value',
    //   ch_name: 'channel_name_value' 
    // }

    var newSettings = {};
    newSettings._id = 1;
    newSettings.api_key = req.body.api_key;
    newSettings.oath_key = req.body.oath_key;
    newSettings.bot_name = req.body.bot_name;
    newSettings.ch_name = req.body.ch_name;


    req.app.get('db').collection(that.plugin.collection, function(err, settings) {
      
      settings.save(newSettings, function(err, result) {
        
        var meta = meta || {};

        req.app.get('ejs').renderFile(__dirname + '/plugins/' + that.plugin.id + '/views/settings.ejs', {
          meta : meta,
          settings : newSettings
          }, function(err, html) {
            if (!err) {
              return res.render('override', {
                content: html,
                plugin: that.plugin.id,
                title: 'Settings ' + that.plugin.name
              });
            } else {
              console.log(err);
              return res.status(500).render('500', {
                title: '500 Internal Server Error'
              });
            }
          }
        );
      });
    });

    // req.app.get('db').collection(that.plugin.collection, function(err, collection) {

    //   console.log(req.body);

    //   collection.find().toArray(function(err, items) {
    //       var meta = meta || {};
    //       req.app.get('ejs').renderFile(__dirname + '/plugins/' + that.plugin.id + '/views/settings.ejs', {
    //         meta : meta,
    //         items : items
    //       }, function(err, html) {
    //         if (!err) {
    //           return res.render('override', {
    //             content: html,
    //             plugin: that.plugin.id,
    //             title: 'Settings ' + that.plugin.name
    //           });
    //         } else {
    //           console.log(err);
    //           return res.status(500).render('500', {
    //             title: '500 Internal Server Error'
    //           });
    //         }
    //       }
    //     );
    //     });
    // });
  }

  // POST request handlers end

  TwitchBotRoutes.prototype.PutRequest = function(req, res, next) {
    console.log('[' + that.plugin.name + '] received a PutRequest request.');
    return res.redirect('/');
  };

  TwitchBotRoutes.prototype.DeleteRequest = function(req, res, next) {
    console.log('[' + that.plugin.name + '] received a DeleteRequest request.');
    return res.redirect('/');
  };

  
  // GET request handlers start

  TwitchBotRoutes.prototype.GetRequestsHandler = function (req, res, next) {
    var that = this;

    var urlParts = req.url.replace(/^\/|\/$/g, '').split(path.sep);
    var action = urlParts[2]; 

    if(action == null) {
      that.PluginIndex(req, res, next);
    } else {
      return res.status(404).render('404', {
        title: '404 Page not found'
      });
    }
  };

  TwitchBotRoutes.prototype.PluginIndex = function(req, res, next) {
    var that = this;
    that.plugin.app.get('db').collection(that.plugin.collection, function(err, collection) {
      collection.findOne({_id : 1}, function(err, settings) {
        var meta = meta || {};
        req.app.get('ejs').renderFile(__dirname + '/plugins/' + that.plugin.id + '/views/settings.ejs', {
          settings: settings,
          meta: meta
        }, function(err, html) {
          console.log(settings);
          if (!err) {
            return res.render('override', {
              content: html,
              plugin: that.plugin.id,
              title: that.plugin.name + ' Settings'
            });
          } else {
            console.log(err);
            return res.status(500).render('500', {
              title: '500 Internal Server Error'
            });
          }
        });
      });
    });
  };

  // GET request handlers end

  var exports = TwitchBotRoutes;

  return exports;

  // HTTP METHODS NOT CURRENTLY USED
  
  // TwitchBotRoutes.prototype.HeadRequest = function(req, res, next) {
  //   console.log('[' + that.plugin.name + '] received a HeadRequest request.');
  //   return res.redirect('/');
  // };

  // TwitchBotRoutes.prototype.OptionsRequest = function(req, res, next) {
  //   console.log('[' + that.plugin.name + '] received a OptionsRequest request.');
  //   return res.redirect('/');
  // };

  // TwitchBotRoutes.prototype.TraceRequest = function(req, res, next) {
  //   console.log('[' + that.plugin.name + '] received a TraceRequest request.');
  //   return res.redirect('/');
  // };

  // TwitchBotRoutes.prototype.ConnectRequest = function(req, res, next) {
  //   console.log('[' + that.plugin.name + '] received a ConnectRequest request.');
  //   return res.redirect('/');
  // };

});