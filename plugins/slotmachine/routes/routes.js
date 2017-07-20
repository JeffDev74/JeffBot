if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'fs', '../index.js', 'path' ], function( fs, plugin, path ) {
  var SlotmachineRoutes = function(plugin) {
    this.plugin = plugin;
    //this.pluginFolder = app.get('plugin folder');
  };

  SlotmachineRoutes.prototype.GetRequest = function(req, res, next) {
    var that = this;
    var appLog = req.app.get('log');
    __dirname = path.resolve(path.dirname(''));
    var urlParts = req.url.replace(/^\/|\/$/g, '').split(path.sep);
    // /plugin/{item_id}        --> DELETE METHOD: DELETE AN ITEM
    // /plugin/{item_id}        --> PUT METHOD: UPDATE/EDIT AN ITEM
    // /plugin                  --> POST METHOD: CREATE NEW AN ITEM

    // /plugin                  --> GET SHOW ALL ITEMS
    // /plugin/{item_id}/edit   --> GET SHOW FOR TO EDIT AN ITEM
    // /plugin/{item_id}        --> GET SHOW SPECIFIC ITEM
    // /plugin/new              --> GET SHOW FORM TO CREATE A NEW ITEM
    console.log('[' + that.plugin.name + '] received a GET request.');

    return that.GetRequestsHandler(req, res, next);
    //return res.redirect('/');
  };

  SlotmachineRoutes.prototype.PostRequest = function(req, res, next) {
    console.log('[' + that.plugin.name + '] received a POST request.');
    return res.redirect('/');
  };
  SlotmachineRoutes.prototype.PutRequest = function(req, res, next) {
    console.log('[' + that.plugin.name + '] received a PutRequest request.');
    return res.redirect('/');
  };

  SlotmachineRoutes.prototype.DeleteRequest = function(req, res, next) {
    console.log('[' + that.plugin.name + '] received a DeleteRequest request.');
    return res.redirect('/');
  };

  SlotmachineRoutes.prototype.GetRequestsHandler = function (req, res, next) {
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


  SlotmachineRoutes.prototype.oapiGet = function(req, res, next) {
    var that = this;
    var urlParts = req.url.replace(/^\/|\/$/g, '').split(path.sep);
    var pageHandle = urlParts[2];
    if(typeof pageHandle != 'undefined' && pageHandle != '') {
      if(pageHandle.toLowerCase() === 'overlay') {
        return that.oapiGetOverlay(req, res, next);
      }
      else {
        console.log('Error: oapi page handle for ['+pageHandle+'] was not implemented');
        res.redirect('/plugin/' + that.plugin.id);
      }
    }
    else {
      // no page handle load the index view for this plugin
      return that.GetIndex(req, res, next);
    }
  };

  SlotmachineRoutes.prototype.oapiGetOverlay = function (req, res, next) {
    var that = this;
    req.app.get('db').collection(that.plugin.collection, function(err, collection) {
        collection.find().toArray(function(err, items) {
          var meta = meta || {};
          req.app.get('ejs').renderFile(__dirname + '/plugins/' + that.plugin.id + '/views/overlay.ejs', {
            meta : meta,
            items : items
          }, function(err, html) {
            if (!err) {
              return res.render('empty', {
                content: html,
                plugin: that.plugin.id,
                title: 'Overlay ' + that.plugin.name
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

  var exports = SlotmachineRoutes;

  return exports;
});