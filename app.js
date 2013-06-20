
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes/index.js')
  , apis = require('./routes/apis.js')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.post('/api/v1/messages', express.limit(140), apis.textBodyParser(), apis.postMessage);
app.post('/api/v1/query', express.limit(1024), express.bodyParser(), apis.searchMessages);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
