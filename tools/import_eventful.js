/*
Imports data from the Eventful.com database into the MongoDB database. 
See http://api.eventful.com/docs/events/search for API description. 
Modify the queries array below to describe the data to import.
*/

var queries = [
	'location=Washington+state&date=Future'
];

var http = require('http')
	, db = require('../lib/db');

function makeUrl(query, page) {
	return 'http://api.eventful.com/json/events/search?app_key=Hm8q48jzstDDTSc7&page_size=100&page_number=' + page + '&' + query;
}

function get(url, callback) {
	var req = http.get(url, function (res) {
		if (res.statusCode !== 200) {
			return callback(new Error('Status code ' + res.statusCode));
		}

		var body = '';
		res.on('data', function (chunk) { body += chunk; });
		res.on('end', function () {
			var content;
			try {
				content = JSON.parse(body);
			}
			catch (e) {
				return callback(e);
			}

			return callback(null, content);
		})
	});

	req.on('error', callback);
}

function formatAddress(event) {
	var components = [];

	if (event.venue_display)
		components.push(event.venue_name);

	['venue_address', 'city_name', 'region_name', 'postal_code'].forEach(function (a) {
		if (event[a])
			components.push(event[a]);
	});

	return components.join(', ');
}

function importQueryPage(i, page) {
	if (!queries[i]) {
		console.log('Success');
		return;
	}

	get(makeUrl(queries[i], page), function (error, result) {
		if (error) throw error;
		
		if (page === 1) {
			console.log('Estimated page count of query', queries[i], 'is', result.page_count);
		}

		if (!result.events || !result.events.event || result.events.event.length === 0) {
			importQueryPage(i + 1, 1);
		}
		else {

			var messages = [];

			result.events.event.forEach(function (event) {
				messages.push({
					created: new Date(event.created).getTime(),
					text: event.title,
					location: {
						type: 'Point',
						coordinates: [ +event.longitude, +event.latitude ]
					},
					location_name: formatAddress(event),
					time: {
						type: 'Moment',
						time: new Date(event.start_time).getTime()
					},
					urls: [ event.url ],
					source: 'eventful.com',
					fid: event.id
				});
			});

			db.insertMessages(messages, function (error) {
				if (error) throw error;

				console.log('Imported query', queries[i] + ', page', page, 'with', result.events.event.length, 'results');
				importQueryPage(i, page + 1);
			});

		}
	})

}

importQueryPage(0, 1);
