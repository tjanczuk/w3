var mongodb = require('mongodb')
    , config = require('./config.js');

// all documents in the db have a schema version equal to app's semver version
var version = require('../package.json').version;

var connect = function (collectionName, callback) {
    var options = { 
        server: { 
            auto_reconnect: true, 
            poolSize: config.mongoPoolSize
        }, 
        db: { 
            safe: true 
        }
    };

    mongodb.connect(config.mongoUrl, options, function (error, db) {
        if (error) {
            return callback(error);
        }

        db.collection(collectionName, function (error, collection) {
            if (error) {
                db.close();
                db = undefined;
            }

            callback(error, collection, db);
        });
    });
}

exports.insertMessages = function (messages, callback) {
    connect('messages', function (error, collection, db) {
        if (error) {
            return callback(error);
        }

        messages.forEach(function (message) { 
            message.version = version;
        });

        collection.insert(
            messages, 
            function (error, result) {
                db.close();
                callback(error, result);
            }
        );
    });
};


/*
query: {
    geometry: {
        type: 'Polygon',
        coordinates: [[[-122,49], [-120,49], [-120,47], [-122,47], [-122,49]]]
    },
    time: {
        type: 'Period',
        time: [ 1371611873300, 1371611900000 ]
    }
}
*/
exports.queryMessages = function (query, callback) {

    var mongoQuery = {
        location: {
            $geoWithin: {
                $geometry: query.geometry
            }
        },
        'time.time' : {
            $gte: query.time.time[0]
        }
    };

    if (Infinity !== query.time.time[1]) {
        mongoQuery['time.time'].$lte = query.time.time[1];
    }

    console.log(JSON.stringify(mongoQuery));

    connect('messages', function (error, collection, db) {
        if (error) {
            return callback(error);
        }

        collection.find(mongoQuery).limit(config.maxQueryLimit + 1).toArray(function (error, result) {
            db.close();
            callback(error, result);
        });
    });
};
