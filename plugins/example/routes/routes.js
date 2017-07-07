if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'fs', '../index.js', 'path' ], function( fs, plugin, path ) {
  var ExampleRoutes = function(plugin) {
    this.plugin = plugin;
    //this.pluginFolder = app.get('plugin folder');
  };

  ExampleRoutes.prototype.GetRequest = function(req, res, next) {
    var that = this;
    var appLog = req.app.get('log');
    __dirname = path.resolve(path.dirname(''));
    var urlParts = req.url.replace(/^\/|\/$/g, '').split(path.sep);
    // /api/plugin/{item_id}        --> DELETE METHOD: DELETE AN ITEM
    // /api/plugin/{item_id}        --> PUT METHOD: UPDATE/EDIT AN ITEM
    // /api/plugin                  --> POST METHOD: CREATE NEW AN ITEM

    // /api/plugin                  --> GET SHOW ALL ITEMS
    // /api/plugin/{item_id}/edit   --> GET SHOW FOR TO EDIT AN ITEM
    // /api/plugin/{item_id}        --> GET SHOW SPECIFIC ITEM
    // /api/plugin/new              --> GET SHOW FORM TO CREATE A NEW ITEM
    console.log('[' + that.plugin.name + '] received a GET request.');

    return that.GetRequestsHandler(req, res, next);
    //return res.redirect('/');
  };

  ExampleRoutes.prototype.PostRequest = function(req, res, next) {
    console.log('[' + that.plugin.name + '] received a POST request.');
    return res.redirect('/');
  };
  ExampleRoutes.prototype.PutRequest = function(req, res, next) {
    console.log('[' + that.plugin.name + '] received a PutRequest request.');
    return res.redirect('/');
  };

  ExampleRoutes.prototype.DeleteRequest = function(req, res, next) {
    console.log('[' + that.plugin.name + '] received a DeleteRequest request.');
    return res.redirect('/');
  };

  // HTTP METHODS NOT CURRENTLY USED
  
  // ExampleRoutes.prototype.HeadRequest = function(req, res, next) {
  //   console.log('[' + that.plugin.name + '] received a HeadRequest request.');
  //   return res.redirect('/');
  // };

  // ExampleRoutes.prototype.OptionsRequest = function(req, res, next) {
  //   console.log('[' + that.plugin.name + '] received a OptionsRequest request.');
  //   return res.redirect('/');
  // };

  // ExampleRoutes.prototype.TraceRequest = function(req, res, next) {
  //   console.log('[' + that.plugin.name + '] received a TraceRequest request.');
  //   return res.redirect('/');
  // };

  // ExampleRoutes.prototype.ConnectRequest = function(req, res, next) {
  //   console.log('[' + that.plugin.name + '] received a ConnectRequest request.');
  //   return res.redirect('/');
  // };


  ExampleRoutes.prototype.GetRequestsHandler = function (req, res, next) {
    var that = this;
    req.app.get('db').collection(that.plugin.collection, function(err, collection) {
        collection.find().toArray(function(err, items) {
          var meta = meta || {};
          req.app.get('ejs').renderFile(__dirname + '/plugins/' + that.plugin.id + '/views/settings.ejs', {
            meta : meta,
            items : items
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
      }
    );
  };

  var exports = ExampleRoutes;

  return exports;
});