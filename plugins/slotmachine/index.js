if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}


// TODO: 
// Create a cue for users to use the slot machine

define([ 'fs', './routes/routes.js' ], function( fs, routes ) {

  var Slotmachine = function(app) {

    // Required
    this.name = 'Slotmachine';
    this.id = this.name.toLowerCase();
    this.collection = 'Slotmachine';
    this.collectionJackPot = 'slotmachine_jackpot';
        
    this.icon = 'icon-book';

    this.routes = new routes(this);
    
    this.app = app;

    this.command = '!spin';

    this.events = app.get('events');
    this.sockets = app.get('sockets');
    
    this.log = app.get('log');
    
    this.slotIsRunning = false;

    this.amountToSpin = 100;

    this.jackpotInitialValue = 100;

    this.jackpot = this.jackpotInitialValue;

    this.init();

  }

  Slotmachine.prototype.init = function(settings) {
    var that = this;

    that.log("Info", '[' + that.name + '] plugin initialized.');

    that.getJackPot(function(err, jackpot) {

      if(!err) {
        that.jackpot = jackpot.value;

        that.sockets.on('connection', function(socket) {
          
          socket.on('update_status', function(data) {
            that.slotIsRunning = data.state;
          });

          socket.on('game_over', function(data) {
            
            {
              // { 
              //    user:
              //      { _id: '146668278',
              //        bio: 'C# Programmer / PHP WebDeveper',
              //        created_at: '2017-02-01T21:30:46.1809Z',
              //        display_name: 'JeffDev',
              //        hours: 1102.0399999999645,
              //        increase: 10,
              //        level: 767,
              //        logo: 'https://static-cdn.jtvnw.net/jtv_user_pictures/jeffdev-profile_image-f274ba2d8cac1f25-300x300.png',
              //        name: 'jeffdev',
              //        type: 'user',
              //        updated_at: '2017-07-20T08:34:10.721282Z',
              //        xp: 64881 
              //    },
              //   amount: 100,
              //   jackpot: 200,
              //   result: false 
              // }
            }

            that.slotIsRunning = false;
            if(data.result) {
              // give xp to the user
              data.user.xp += that.jackpot;
              that.events.emit('saveUser', data.user, function(result) {
                console.log('The user ['+data.user.display_name+'] won ['+that.jackpot+'] xp now is ['+data.user.xp+']');
                // reset jack pot
                that.jackpot = that.jackpotInitialValue;
              });
            
            } else {
              console.log("The user lost");
            }

            var jackpot = {};
            jackpot.value = that.jackpot;
            that.saveJackPot(jackpot, function() {
              console.log('Jackpot was saved to ['+jackpot.value+']');
            });

          });

          socket.on('slotmachine_stopped', function(data) {
            socket.emit('stop', {});
          });

        });

        that.events.on('twitch_chat', function(twitch) {
          
          {
            // { channel: '#jeffdev',
            //   user:
            //    { badges: { moderator: '1', bits: '100' },
            //      color: '#8A2BE2',
            //      'display-name': 'TheYagich01',
            //      emotes: null,
            //      id: 'd1446431-a192-4089-9395-0a2522d1deb5',
            //      mod: true,
            //      'room-id': '146668278',
            //      'sent-ts': '1500536675433',
            //      subscriber: false,
            //      'tmi-sent-ts': '1500536674608',
            //      turbo: false,
            //      'user-id': '43424100',
            //      'user-type': 'mod',
            //      'emotes-raw': null,
            //      'badges-raw': 'moderator/1,bits/100',
            //      username: 'theyagich01',
            //      'message-type': 'chat' },
            //   message: 'o/' 
            // }
          }

          if(twitch.message.startsWith(that.command)) {

            if(that.slotIsRunning) {
              console.log("Returning the machine is running");
              return;
            }

            var amount = twitch.message.replace(that.command,'');
            var validAmount = parseInt(amount, 10);
            if(validAmount === validAmount) {
              var userId = twitch.user['user-id'];

              that.events.emit('getUser', userId, function(user) {

                {
                  // { 
                  //   _id: '43424100',
                  //   bio: 'Fusioneer.',
                  //   created_at: '2013-05-11T13:10:37.745966Z',
                  //   display_name: 'TheYagich01',
                  //   hours: 138.2400000000022,
                  //   increase: 0,
                  //   level: 96,
                  //   logo: 'https://static-cdn.jtvnw.net/jtv_user_pictures/theyagich01-profile_image-56fdc4031fa53b85-300x300.png',
                  //   name: 'theyagich01',
                  //   type: 'user',
                  //   updated_at: '2017-07-17T16:06:21.661018Z',
                  //   xp: 7573 
                  // }
                }

                if(!user) {
                  console.log("The user is not in the database");
                  return;
                }

                if(validAmount <= user.xp) {
                  if(validAmount === that.amountToSpin) {
                    
                    that.jackpot += validAmount;

                    // remove xp from the user

                    // that.events.on('saveUser', function(user, callback) {
                    //   if(user._id) {
                    //     that.dbModel.saveUser(user, function(err, result) {
                    //       if(callback) {
                    //         callback(result);
                    //       }
                    //     });
                    //   }
                    // });
                    user.xp -= that.amountToSpin;
                    that.events.emit('saveUser', user, function(result) {
                      console.log('The user ['+user.display_name+'] was saved xp is ['+user.xp+']');
                    });
                    
                    var data = {};
                    data.user = user;
                    data.amount = validAmount;
                    data.jackpot = that.jackpot;
                    that.sockets.emit('start', data);

                    console.log('User ['+user.display_name+'] spinning for ['+validAmount+']');
                  }
                } else {
                  console.log('The user ['+user.display_name+'] does not have ['+validAmount+'] he/she have ['+user.xp+']');
                }


              }); // end find user
            } // end check valid amount
          } // end twitch message have command
        }); // end on twitch chat

      } else {
        console.log('Failed to load slot machine the jackpot was not found in the db.');
      }

    });
  }; // end plugin init

  Slotmachine.prototype.saveJackPot = function(jackpot, callback) {
    var that = this;
    that.app.get('db').collection(that.collectionJackPot, function(err, collection) {
      jackpot._id = 1;
      collection.save(jackpot, function(err, result) {
        if(callback) {
          callback(err, result);
        }
        else {
          that.log('ERROR', '[' + that.plugin.name + '] saveJackPot the callback is null.');
        }
      });
    });
  };

  Slotmachine.prototype.getJackPot = function(callback) {
    var that = this;
    that.app.get('db').collection(that.collectionJackPot, function(err, collection) {
      collection.findOne({'_id': 1}, function(err, jackpot) {
        if(callback) {
          callback(err, jackpot);
        }
        else {
          that.log('ERROR', '[' + that.plugin.name + ' MODEL] getSettings the callback is null.');
        }
      }); // collection find one
    }); // get collection
  };

  var exports = Slotmachine;

  return exports;
});