var assert = require('assert')
    , db = require('../lib/db.js')
    , config = require('../lib/config.js');

function extractAll(regexp, text) {
    var result = [];

    var match;
    while ((match = regexp.exec(text)) !== null) {
        result.push(match[1]);
    }

    return result;
}

function parseMessage(message) {

    var result = [];

    // parse tags and people

    var tags = extractAll(/\#([^\s\n$]+)/g, message);
    var people = extractAll(/\@([^\s\n$]+)/g, message);

    // parse locations

    var coordsRegex = /\$\(([\+\-]?\d+\.?\d*),([\+\-]?\d+\.?\d*)[\:\s]*([^)]*)\)/g;
    var locations = [];
    var match;
    while ((match = coordsRegex.exec(message)) !== null) {
        var location = {
            location: {
                type: 'Point',
                coordinates: [ +match[2], +match[1] ]
            },
            location_name: match[3]
        };

        if (location.location.coordinates[0] < -180 || location.location.coordinates[0] > 180
            || location.location.coordinates[1] < -90 || location.location.coordinates[1] > 90) {
            throw new Error('Invalid coordinates.')
        }

        locations.push(location);
    }

    if (locations.length === 0) {
        throw new Error('At least one location must be specified.');
    }

    // parse times

    var timeRegex = /\^\(([^\)]+)/g;
    var times = [];
    while ((match = timeRegex.exec(message)) !== null) {
        var time = {
            type: 'Moment',
            time: [ Date.parse(match[1]) ]
        };

        if (!time.time) {
            throw new Error('Invalid time.');
        }

        times.push(time);
    }

    if (times.length === 0) {
        throw new Error('At least one time must be specified.');
    }

    // generate cross product of locations and times

    var now = Date.now();
    locations.forEach(function (location) {
        times.forEach(function (time) {
            result.push({
                created: now,
                text: message,
                tags: tags,
                people: people,
                location: location.location,
                location_name: location.location_name,
                time: time
            })
        });
    });

    return result;
}

exports.textBodyParser = function () {
    return function (req, res, next) {
      req.setEncoding('utf8');
      var body = '';
      req.on('data', function(chunk) {
        body += chunk;
      });
      req.on('end', function(){
        req.body = body;
        next();
      });
    }
};

exports.postMessage = function(req, res){
    var messages;
    try {
        messages = parseMessage(req.body);
    }
    catch (e) {
        return res.send(400, e.message);
    }

    db.insertMessages(messages, function (error, result) {
        if (error) {
            res.send(500, JSON.stringify(error, null, 2));
        }
        else {
            messages.forEach(function (message) {
                message.id = message._id;
                delete message._id;
            });

            res.json(201, messages);
        }
    });
};

exports.searchMessages = function(req, res){
    var query = req.body;
    try {
        assert.ok(typeof query === 'object', 'The query must be a JSON object.');
        assert.ok(typeof query.geometry === 'object', 'The query.geometry must be a geoJSON Polygon object.');
        assert.ok(query.geometry.type === 'Polygon', 'The query.geometry must be a geoJSON Polygon object.');
        assert.ok(Array.isArray(query.geometry.coordinates), 'The query.geometry must be a geoJSON Polygon object.');
        assert.ok(typeof query.time === 'object', 'The query.time must be a JSON object.');
        assert.ok(query.time.type === 'Period', 'Unsupported query.time.type value. Only Period is supported.');
        assert.ok(Array.isArray(query.time.time), 'The query.time.time must be an array with two integers.');
        assert.ok(!isNaN(query.time.time[0]), 'The query.time.time must be an array with two integers.');
        assert.ok(!isNaN(query.time.time[1]), 'The query.time.time must be an array with two integers.');
    }
    catch (e) {
        return res.send(400, e.message);
    }

    db.queryMessages(query, function (error, result) {
        if (error) {
            res.send(500, JSON.stringify(error, null, 2));
        }
        else if (result.length > config.maxQueryLimit) {
            res.send(400, 'Number of query results exceeded the limit.');
        }
        else {
            result.forEach(function (message) {
                message.id = message._id;
                delete message._id;
            });

            res.json(200, result);
        }
    });
};

exports.addCommonApiHeaders = function(req, res, next) {
    res.set('Cache-Control', 'no-cache');
    res.set('Access-Control-Allow-Origin', '*');
    next();
};
