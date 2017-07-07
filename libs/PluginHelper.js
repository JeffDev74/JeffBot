if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
 *  The PluginHelper provides helper function for handling plugins.
 *
 * @class PluginHelper
 * @constructor 
 */
define([ 'fs', 'requirejs' ], function( fs, requirejs ) {

  var PluginHelper = function(app) {
    this.app = app;
    this.pluginFolder = app.get('plugin folder');
  };

  /**
   * Gets the plugin item from the database
   * 
   * @method findItem
   * @param {String} plugin The id of the plugin
   * @param {String} id The id of the item to find
   * @param {Function} callback The callback function to execute after find
   */
  PluginHelper.prototype.findItem = function(plugin, id, callback) {
    var ObjectID = this.app.get('mongo').ObjectID;
    this.app.get('db').collection(plugin, function(err, collection) {
      collection.find({
        _id: new ObjectID(id + '')
      }).toArray(function(err, result) {
        if ((!err) && (result.length != 0)) {
          var item = result[0];
          callback(null, item, collection);
        } else {
          callback((err) ? err : 'Item not found (ID: "' + id + '")');
        }
      });
    });
  };

  /**
   * Parse all plugins into an array
   * 
   * @method getPluginList
   * @param {Function} callback The callback method to execute after parsing
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {Object} callback.result An array containing the plugins
   */
  PluginHelper.prototype.LoadPluginList = function(callback) {
    var pluginList = [];
    var that = this;
    var files = fs.readdirSync(that.pluginFolder);

    function requireRecursive(files) {
      var file = files.pop();
      requirejs([that.pluginFolder + '/' + file + '/index.js'], function(Plugin) {
        pluginList.push(new Plugin(that.app));
        if (files.length>0) {
          requireRecursive(files);
        } else {
          return callback(null, pluginList);
        }
      });
    }

    requireRecursive(files);
  };

  PluginHelper.prototype.GetPlugin = function (plugin_id, callback) {
    // Use array.some so the loop will end with the return.
    // when using foreach the loop will not end with the return
    // http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
    this.app.locals.plugins.some(function(plugin) {
    //this.app.get('plugins').some(function(plugin) {
      if(plugin.id == plugin_id) {
        return callback(plugin);
      }
    });
  };

  var exports = PluginHelper;

  return exports;

});
