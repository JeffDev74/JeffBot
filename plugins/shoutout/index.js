if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'fs', './routes/routes.js' ], function( fs, routes ) {

  var Shoutout = function(app) {

    // Required
    this.name = 'Shoutout';
    this.id = this.name.toLowerCase();
    this.collection = 'Shoutout';
        
    this.icon = 'icon-book';

    this.routes = new routes(this);
    
    this.command = '!caster';

    this.app = app;

    this.events = app.get('events');
    this.sockets = app.get('sockets');
    
    this.log = app.get('log');
    
    this.init();
  }

  Shoutout.prototype.init = function(settings) {
    var that = this;
    that.log("Info", '[' + that.name + '] plugin initialized.');

    that.events.on('twitch_chat', function(twitch) {
          
          {
            // { 
            //   channel: '#jeffdev',
            //   user:
            //    { badges: { broadcaster: '1', subscriber: '0', premium: '1' },
            //      color: null,
            //      'display-name': 'JeffDev',
            //      emotes: null,
            //      id: 'ab1f04ab-b989-49b0-b107-5f98748ca523',
            //      mod: true,
            //      'room-id': '146668278',
            //      'sent-ts': '1500678343040',
            //      subscriber: true,
            //      'tmi-sent-ts': '1500678343082',
            //      turbo: false,
            //      'user-id': '146668278',
            //      'user-type': 'mod',
            //      'emotes-raw': null,
            //      'badges-raw': 'broadcaster/1,subscriber/0,premium/1',
            //      username: 'jeffdev',
            //      'message-type': 'chat' },
            //   message: '!caster @JeffDev' 
            // }
          }

          if(twitch.user.mod) {
            if(twitch.message.startsWith(that.command)) {
              var result = twitch.message.split(' ');
              if(result[1]) {
                var casterName = result[1].substring(1);
                that.events.emit('getUserByName', casterName, function(user) {
                  if(user) {
                    var channelUrl = 'https://www.twitch.tv/' + user.name;
                    var chatMessage = 'Please check out ' + user.display_name + ' awesome channel! Give them a follow at ' + channelUrl + ' and check out their amazing content!';
                    var overlayMessage = 'Please check out ' + user.display_name + ' awesome channel! Give them a follow and check out their amazing content!';
                    that.events.emit('send_twitch_chat', {channel : 'jeffdev', message : chatMessage});
                    that.sockets.emit(that.id + '_caster', { name : casterName, logo : user.logo, message : overlayMessage });
                  } else {
                    var channelUrl = 'https://www.twitch.tv/' + casterName;
                    var chatMessage = 'Please check out ' + casterName + ' awesome channel! Give them a follow at ' + channelUrl + ' and check out their amazing content!';
                    var overlayMessage = 'Please check out ' + casterName + ' awesome channel! Give them a follow and check out their amazing content!';
                    that.events.emit('send_twitch_chat', {channel : 'jeffdev', message : chatMessage});
                    that.sockets.emit(that.id + '_caster', { name : casterName, logo : null, message : overlayMessage });
                  }
                }); // end get user by name
              } // do we have a caster name?
            } // end twitch message have command
          } // end is viwer a mod
        }); // end on twitch chat
  };

  var exports = Shoutout;

  return exports;
});