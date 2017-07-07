/**
 * index.js (https://github.com/JeffDev74/JeffBot)
 *
 * @file index.js
 * @brief index.js - Twitch Bot with node.js and Raspberry PI
 * @author JeffDev
 */

/**
 * RequireJS
 * @see http://requirejs.org/docs/node.html
 */
var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require
});

/**
 * Express
 * @see http://expressjs.com/guide.html
 */
requirejs([ 'http', 'https', 'connect', 'mongodb', 'path', 'express', 'node-conf', 'socket.io', 'ejs', 'cookie', 'events', './routes', './libs/PluginHelper.js', './libs/DataParser.js','cookie-parser', 'serve-favicon', 'morgan', 'body-parser', 'method-override', 'express-session'], 
  function(Http, Https, Connect, Mongo, Path, Express, Conf, Socketio, ejs, Cookie, Events, Routes, PluginHelper, DataParser, cookiep , sfavicon, morgan, bparser, moverride, esession) {

  // Load configuration
  var node_env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
  var config = Conf.load(node_env);

  if (!config.port || !config.secret || !config.mongo || !config.mongo.name || !config.mongo.host || !config.mongo.port || !config.mongo.user) {
    return console.log('\u001b[31mMissing configuration file \u001b[33mconfig/' + node_env + '.json\u001b[31m. Create configuration file or start with `NODE_ENV=development node index.js` to use another configuration file.\033[0m');
  }

  // Initiate express
  var app = Express();

  var log = function (/*level, message*/) {
    var args = [].slice.call(arguments);
    if (config.debug) {
      console.log(String('\x1b[36m' + new Date().toLocaleString()) + '\x1b[0m \x1b[33m' + args.shift() + ' \x1b[0m ' + args.join(', ') + '');
    }
  }

  // Load database
  var db = new Mongo.Db(config.mongo.name, new Mongo.Server(config.mongo.host, config.mongo.port, config.mongo.user, {
    native_parser: false
  }), {w:1});

  // Load mqtt server
  var ascoltatore = {
      //using ascoltatore
      type: 'mongo',
      url: 'mongodb://'+config.mqtt.dbhost+':'+config.mqtt.dbport+'/'+config.mqtt.dbport,
      pubsubCollection: config.mqtt.dbcollection,
      mongo: {}
  };

  var cookieParser = cookiep(config.secret);// Express.cookieParser(config.secret);
  var sessionStore = new Connect.middleware.session.MemoryStore();

  // MongoDB
  db.open(function(err, db) {
    if (err) {
      return console.log('\u001b[31mFailed to connect to MongoDB: ' + err + '\033[0m');
    } else {
      //var server = Https.createServer(options, app).listen(config.port, function() {
      var server = Http.createServer(app).listen(config.port, function() {
        log('info' , 'Twitch bot listening on port ' + config.port);
      });
      
      //server.setSecure(credentials);

      if (config.secret == "CHANGE_ME") {
        console.log('\u001b[31mWARNING: Change secret string in config/' + node_env + '.json\033[0m');
      }

      // socket.io
      var io = Socketio.listen(server);

      //io.configure(function() {
        io.set('log level', 0);
        // Permission check
        io.set('authorization', function(data, callback) {

          //hack to pass authorization
          return callback(null, true);

          if (data.headers.cookie) {
            if(typeof data.headers.cookie !== 'string') {
              callback('Unauthorized', false);
            }

            var c = Cookie.parse(data.headers.cookie);
            // Temporaty until fix cookie
            if(c[config.secret_key] == 'undefined') { return callback(null, true); }
            // Temporaty until fix cookie
            sessionStore.get(c[config.secret_key].substring(2, 26), function(err, session) {
              if (err || !session) {
                console.log('fix socket session cookie');
                //callback('Error', false);
                data.session = session;
                callback(null, true);
              } else {
                data.session = session;
                callback(null, true);
              }
            });
          } else {
            var token = data.headers.authorization;
            app.get('db').collection('User', function(err, u) {
              u.find({
                token: token
              }).toArray(function(err, r) {
                if (r.length === 0) {
                  callback('Unauthorized', false);
                } else {
                  callback(null, true);
                }
              });
            });
          }
        });
      //});

      var clientList = [];
      io.sockets.on('connection', function(socket) {
        clientList.push(socket.id);
        socket.on('disconnect', function() {
          var i = clientList.indexOf(socket.id);
          clientList.splice(i, 1);
        });
      });

      // Express
      //app.configure(function() {
        app.set('events', new Events.EventEmitter());
        app.set('views', Path.join(__dirname, 'views'));// + '/views');
        
        app.set('view engine', 'ejs');
        app.set('ejs', ejs);
        
        app.set('server', server);
        app.set('sockets', io.sockets);
        app.set('mongo', Mongo);
        app.set('db', db);
        app.set('log', log);
        app.set('clients', clientList);
        app.set('config', config);
        app.set('routes', Routes);
        app.set('theme folder', __dirname + '/public/css/themes');
        app.set('plugin folder', __dirname + '/plugins');
        app.set('plugin helper', new PluginHelper(app));
        app.set('data_parser', new DataParser(app));
        //app.use(Express.favicon());
        app.use(morgan('dev'));
        //app.use(Express.bodyParser());
        app.use(bparser.json());
        // app.use(Express.urlencoded());
        app.use(bparser.urlencoded({ extended: true }))
        
        app.use(moverride());
        app.use(cookieParser);
        app.use(esession({
          store: sessionStore,
          key: config.secret_key
        }));
        
        app.use(function(req, res, next) {
          res.locals.messages = req.session.messages;
          next();
        });

        app.use(function(req, res, next) {
          var session = req.session;
          var messages = session.messages || (session.messages = []);

          req.flash = function(type, message) {
            messages.push([type, message]);
          }

          next();
        });

        app.use(sfavicon(__dirname + '/public/twitch.ico'));
        app.use(Express.static(Path.join(__dirname, 'public')));
        //app.use(app.router);
        
      //});

      // Load theme
      app.get('db').collection('Settings', function(err, s) {
        s.find({
          'key': 'theme'
        }).toArray(function(err, result) {
          if (err || result.length == 0 || result[0].value == 'default') {
            app.locals.theme = '/css/bootstrap.min.css';
          } else {
            app.locals.theme = '/css/themes/' + result[0].value;
          }
        });
      });
      
      // Routes
      app.get('/register', Routes.preRoute, Routes.showRegister);
      app.post('/register', Routes.preRoute, Routes.doRegister);

      app.get('/login', Routes.preRoute, Routes.showLogin);
      app.post('/login', Routes.preRoute, Routes.doLogin);
      app.post('/api/login', Routes.preRoute, Routes.createAuthToken);

      app.get('/', Routes.preRoute, Routes.isAuthorized, Routes.index);

      app.get('/settings', Routes.preRoute, Routes.isAuthorized, Routes.settings);
      app.post('/settings/password', Routes.preRoute, Routes.isAuthorized, Routes.changePassword);
      app.post('/settings/user/create', Routes.preRoute, Routes.isAuthorized, Routes.createUser);
      app.get('/settings/user/delete/:email', Routes.preRoute, Routes.isAuthorized, Routes.deleteUser);
      app.post('/settings/theme', Routes.preRoute, Routes.isAuthorized, Routes.changeTheme);
      
      app.get('/logout', Routes.preRoute, Routes.logout);
      
      // app.get('/js/plugin:/jsFile:', Routes.specifiedPluginJS);
      app.get('/js/:plugin/:jsFile', Routes.specifiedPluginJS);
      app.get('/css/:plugin/:cssFile', Routes.specifiedPluginCSS);
      
      app.get('/js/plugins.js', Routes.pluginsJs);
      app.get('/css/plugins.css', Routes.pluginsCss);


      // PLUGIN CUSTOM ROUTES
      app.all('/plugin/:plugin', Routes.isAuthorized, Routes.preRoute, Routes.checkPluginRoutes, Routes.notFound);
      app.all('/plugin/:plugin/*', Routes.isAuthorized, Routes.preRoute, Routes.checkPluginRoutes, Routes.notFound);

      // DEPRECATED UPDATE ROUTE IN THE HTML FILES
      // AND REMOVE THIS ROUTES
      app.get('/settings/:plugin', Routes.preRoute, Routes.isAuthorized, Routes.settings, Routes.notFound);
      app.post('/settings/:plugin', Routes.preRoute, Routes.isAuthorized, Routes.saveSettings, Routes.notFound);

      // API WITH AUTH
      app.all('/api/:plugin', Routes.isAuthorized, Routes.preRoute, Routes.api, Routes.notFound);
      app.all('/api/:plugin/*', Routes.isAuthorized, Routes.preRoute, Routes.api, Routes.notFound);

      // API WITHOUT AUTH
      app.all('/oapi/:plugin', Routes.preRoute, Routes.api, Routes.notFound);
      app.all('/oapi/:plugin/*', Routes.preRoute, Routes.api, Routes.notFound);

      app.getFlashMessage = function (req, res, callback) {
        var msg = {};
        msg.text = '';
        msg.type = 'info'; // warning success danger info

        msg = req.session.message || {}; 

        if(typeof(msg) == 'undefined') {
          msg.text = '';
          msg.type = 'info';
        }

        // add flash message to vars going to render view
        //vars.flash_message = msg;

        // Reset session message to empty message
        req.session.message = {};
        req.session.message.text = '';
        req.session.message.type = 'info';

        return callback(msg);
      }

      app.renderView = function(vars, req, res, next) {
        this.getFlashMessage(req, res, function(msg) {
          vars.flash_message = msg;
          return res.render('override', vars);
        });
        
        // function render(items, meta) {
        //   var meta = meta || {};
        //   app.get('ejs').renderFile(__dirname + '/../plugins/' + plugin.id + '/views/' + type + '.ejs', {
        //     items: items,
        //     meta: meta,
        //     symbols : app.get('config').sensor_symbols,
        //     esp_gpios : app.get('config').esp_gpios,
        //     dataParser : app.get('data_parser')
        //   }, function(err, result) {
        //     if (!err) {
        //       html.append(result);
        //     } else {
        //       console.log(err);
        //     }
        //   });
        // }

      };

      app.get('plugin helper').LoadPluginList(function(err, plugins) {
        app.locals.plugins = plugins;
        app.set('plugins', plugins);

        // 404 Not found
        app.all('*', Routes.notFound);

      });
    }
  });
});
