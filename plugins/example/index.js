if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'fs', './routes/routes.js' ], function( fs, routes ) {

  var Example = function(app) {

    // Required
    this.name = 'Example';
    this.id = this.name.toLowerCase();
    this.collection = 'Example';
        
    this.icon = 'icon-book';

    this.routes = new routes(this);
    

    this.app = app;
    
    // that.pluginHelper = app.get('plugin helper');
    // that.mqtt_server = app.get('mqtt');
    this.log = app.get('log');
    
    // that.routes = new ExampleRoutes(that);
    
    this.init();

    // var that = this;
    // app.get('sockets').on('connection', function(socket) {
    //   //  toggle
    //   socket.on('example-switch', function(data) {
    //     that.espswitch(data);
    //   });
    // });
  }

  Example.prototype.init = function(settings) {
    var that = this;
    that.log("Info", '[' + that.name + '] plugin initialized.');
  };

  var exports = Example;

  return exports;
});