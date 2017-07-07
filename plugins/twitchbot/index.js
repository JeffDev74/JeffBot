if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'fs', './routes/routes.js', 'path', 'tmi.js' ], function( fs, routes, path, tmi ) {

  var TwitchBot = function(app) {

    // Required
    this.name = 'TwitchBot';
    this.id = this.name.toLowerCase();
    this.collection = 'TwitchBot';
        
    this.icon = 'icon-book';

    this.routes = new routes(this);

    this.app = app;

    // that.pluginHelper = app.get('plugin helper');
    // that.mqtt_server = app.get('mqtt');
    this.log = app.get('log');

    this.config = app.get('config');

    this.events = app.get('events');
    
    // that.routes = new TwitchBotRoutes(that);
    
    this.bot = null;
    this.botOptions = {};

    this.groupBot = null;

    this.init();
  }

  TwitchBot.prototype.loadText = function(filePath, callback) {
    fs.readFile(filePath, { encoding: 'utf-8'}, function(err,data) {
      if (!err) {
        callback(data);
      } else {
        console.log(err);
      }
    });
  };

  TwitchBot.prototype.init = function(settings) {
    var that = this;
    __dirname = path.resolve(path.dirname(''));

    that.loadText(__dirname + "/plugins/" + that.id + "/config/oath.txt", function(oath) {
      that.botOptions = {
        options : { debug : false },
        connections : { cluster:"aws", reconnect: true},
        identity: { username: that.config.bot_name, password: oath },
        channels: [that.config.bot_ch_name]
      }

      that.bot = new tmi.client(that.botOptions);

      that.bot.connect().then(function(data) {
        that.log('Info', '[' + that.name + '] Bot is connected.');
        that.events.emit('twitch_bot_onconnect', data);
      });

      that.bot.on('chat', function(channel, user, message, self) {
        {
          // { 
          //   badges: { broadcaster: '1', premium: '1' },
          //   color: null,
          //   'display-name': 'JeffDev',
          //   emotes: null,
          //   id: '4b578f5a-d446-49ee-a784-0871f8eb9e31',
          //   mod: false,
          //   'room-id': '146668278',
          //   'sent-ts': '1497038145143',
          //   subscriber: false,
          //   'tmi-sent-ts': '1497038144798',
          //   turbo: false,
          //   'user-id': '146668278',
          //   'user-type': null,
          //   'emotes-raw': null,
          //   'badges-raw': 'broadcaster/1,premium/1',
          //   username: 'jeffdev',
          //   'message-type': 'chat' 
          // }
        }

        that.onChat(channel,user,message,self);
      });

      that.bot.on("cheer", function (channel, userstate, message) {
          that.onCheer(channel, userstate, message);
      });


      // // To use this I must be connected as the streamer
      // that.bot.on("hosted", function (channel, username, viewers) {
      //   // Do your stuff.
      // });

      // Create a group bot so we can send wispers
      // https://github.com/tmijs/tmi.js/issues/95
      var channel = '';
      var identity = { username: that.config.bot_name, password: oath }
      var greeting = 'Welcome to the stream! Hope you enjoy ^-^';

      that.groupBot = new tmi.client({
        options: { debug: false },
        identity,
        connection: { cluster: 'group' }
      });

      // that.bot.on('connect', (channel, username) => {
      //   that.groupBot.whisper('jeff', greeting);
      // });

      that.groupBot.connect().then(function(data) {
        that.log('Info', '[' + that.name + '] Wisper Bot is connected.');
        that.events.emit('twitch_wisperbot_onconnect', data);
      });

      // Promise.all([that.bot.connect(), that.groupBot.connect()])
      // .then(() => that.events.emit('twitch_bot_completely_connected'));


    });

    that.events.on('send_twitch_wisper', function(data) {//toUser, message 
      
      // {
      //   toUsername : 'jeffdev'
      //   message : 'Message to send',
      // }
      
      that.onSendTwitchWisper(data);
    });

    that.events.on('send_twitch_chat', function(data) {//channel, user, message
      that.onSendTwitchChat(data);
    });

    that.log("Info", '[' + that.name + '] plugin initialized.');
  };

  TwitchBot.prototype.onChat = function(channel, user, message, self) {
    var that = this;
    var payload     = {};
    payload.channel = channel;
    payload.user    = user;
    payload.message = message;
    
    that.events.emit('twitch_chat', payload);
  };

  TwitchBot.prototype.onCheer = function(channel, userstate, message) {
    var that = this;
    var payload = {};
    payload.channel = channel;
    payload.userState = userstate;
    payload.message = message;
    that.events.emit('twitch_cheer', payload);
  };


  TwitchBot.prototype.onSendTwitchChat = function(data) {
    var that = this;
    that.bot.say(data.channel, data.message);
    //that.bot.action(data.channel, data.message);
  };

  TwitchBot.prototype.onSendTwitchWisper = function(data) {
    var that = this;
    // {
    //   toUsername : 'jeffdev'
    //   message : 'Message to send',
    // }
    if(data.toUsername && data.message) {
      that.groupBot.whisper(data.toUsername, data.message);
    }
  };

  var exports = TwitchBot;

  return exports;
});