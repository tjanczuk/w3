
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes/index.js')
  , apis = require('./routes/apis.js')
  , http = require('http')
  , path = require('path')
  , config = require('./lib/config.js')
  , cookieSession = require('./lib/cookieSession.js')
  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;

// passport-twitted configuration based on 
// https://github.com/jaredhanson/passport-twitter/blob/master/examples/signin/app.js

passport.serializeUser(function(user, done) {
    // TODO: persist the user profile in database
    var serialized = { 
        issuer: 'Twitter', 
        id: user.username, 
        name: user.displayName 
    };

    done(null, serialized);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new TwitterStrategy({
        consumerKey: config.twitterConsumerKey,
        consumerSecret: config.twitterConsumerSecret,
        callbackURL: 'http://w3.surla.mobi/login/twitter/callback'
    },
    function(token, tokenSecret, profile, done) {
        return done(null, profile);
    }
));  

function ensureAuthenticated(failfast) {
    return function (req, res, next) {
        if (req.isAuthenticated()) { 
            return next(); 
        }
        else if (typeof config.apiKey !== 'undefined' && config.apiKey === req.query.apiKey) {
            req.apiAccessAuthenticated = true;
            return next();
        }

        failfast ? res.send(401) : res.redirect('/login');
    }
}

function ensureAuthorized(failfast) {
    return function ensureAuthorized(req, res, next) {
        if (req.apiAccessAuthenticated || config.betaUsers.some(function (user) { return user === req.user.id; })) {
            return next(); 
        }

        failfast ? res.send(403) : res.redirect('/beta');
    }
}

var app = express();

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser(config.sessionSecret));
app.use(express.methodOverride());
app.use(cookieSession(config.sessionSecret));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.options('*', 
    routes.corsResponse);
app.get('/login', 
    routes.login); // shows login page
app.get('/login/twitter', 
    passport.authenticate('twitter')); // starts auth flow with Twitter
app.get('/login/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/' }),
  routes.loginSuccess); // ends auth flow with Twitter
app.get('/beta', 
    routes.beta);
app.get('/logout', 
    ensureAuthenticated(), 
    routes.logout);
app.get('/', 
    ensureAuthenticated(), 
    ensureAuthorized(), 
    routes.index);
app.post('/api/v1/messages', 
    ensureAuthenticated(true),
    ensureAuthorized(true),
    express.limit(config.maxMessageSize), 
    apis.textBodyParser(), 
    apis.addCommonApiHeaders,
    apis.postMessage);
app.post('/api/v1/query', 
    ensureAuthenticated(true),
    ensureAuthorized(true),
    express.limit(config.maxQuerySize), 
    express.bodyParser(), 
    apis.addCommonApiHeaders,
    apis.searchMessages);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
