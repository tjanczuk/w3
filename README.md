What Where When
===

[http://w3.surla.mobi](http://w3.surla.mobi)  

## REST APIs

### Posting messages

To post new messages to the system, use this endpoint:

```
POST /api/v1/messages
```

Currently the endpoint is not authenticated, but it will be.

#### Request body 

The content type of the HTTP request must contain the message to be posted as `text/plain` content type. The maximum length of the request is 140 bytes. The reqeust:

* must specify at least one location using the `$(long,lat[:| <description>])` notation  
* must specify at least one moment in time using the `^(<ISO time>)` notation  
* may specify any number of tags using the `#<tagName>` notation  
* may specify any number of people references using the `@<person>` notation  

For example, this is a valid request body:

```
Test message $(-120,24: My favorite fishing spot) $(20,21: My second best) ^(2013-06-19) ^(2013-06-20) 
#fishing /cc @theworld @tjanczuk
```

#### Request processing

The service validates and normalizes the request by generating a a the cross-product of all locations and times specified in the message. Each entry in that cross-product is specific to a single location and single moment in time. The resulting array of entries is inserted into the Mongo databse. In case of the sample request above, four entries would be generated. 

#### Response

The endpoint returns HTTP 400 status code when the submitted data is invalid. The body of the response contains details of the error.

The endpoint returns HTTP 500 status code when inserting to the database fails. The body of the response contains details of the error.

The endpoint returns HTTP 201 status code when the message was successfuly persisted in the database. The body of the HTTP response contains `application/json` representation of the normalized array of entries inserted into the database. For example, given the following request:

```
Test message $(-120,24: My favorite fishing spot) ^(2013-06-19) ^(2013-06-20) 
#fishing /cc @theworld @tjanczuk
```

the response should look as follows:

```
[
  {
    "created": 1371701758573,
    "text": "Test message $(-120,24: My favorite fishing spot) ^(2013-06-19) ^(2013-06-20) #fishing /cc @theworld @tjanczuk",
    "tags": [
      "fishing"
    ],
    "people": [
      "theworld",
      "tjanczuk"
    ],
    "location": {
      "type": "Point",
      "coordinates": [
        -120,
        24
      ]
    },
    "location_name": "My favorite fishing spot",
    "time": {
      "type": "Moment",
      "time": [
        1371600000000
      ]
    },
    "version": "0.0.1",
    "id": "51c28200e345dc7f22000012"
  },
  {
    "created": 1371701758573,
    "text": "Test message $(-120,24: My favorite fishing spot) ^(2013-06-19) ^(2013-06-20) #fishing /cc @theworld @tjanczuk",
    "tags": [
      "fishing"
    ],
    "people": [
      "theworld",
      "tjanczuk"
    ],
    "location": {
      "type": "Point",
      "coordinates": [
        -120,
        24
      ]
    },
    "location_name": "My favorite fishing spot",
    "time": {
      "type": "Moment",
      "time": [
        1371686400000
      ]
    },
    "version": "0.0.1",
    "id": "51c28200e345dc7f22000013"
  }
]      
```

### Querying messages

To query messages, use this endpoint: 

```
POST /api/v1/query
```

The endpoint does not require authentication.

#### Request body

Request body must be `application\json` and specify the query in the following format:

```
{
    geometry: {
        type: 'Polygon',
        coordinates: [[[-122,49], [-120,49], [-120,47], [-122,47], [-122,49]]]
    },
    time: {
        type: 'Period',
        time: [ 1371611873300, 1371611900000 ]
    }
}
``` 

The `geometry` property must be a geoJSON object of type `Polygon`. *The coordinates must be closed*, i.e. the last point must be the same as the first. 

The `time` property is a JSON object with two properties: `type` and `time`. The `type` at present must be equal to `Period`. This is to allow future extensibility of specifying time using other concepts (e.g. recurrence). The `time` property must currently be an array of two integers: time from and time to, specified as number of milliseconds since 1 January 1970 UTC (i.e. `Date.now()` in JavaScript). The second integer may be `Infinite` to indicate unbounded upper limit. 

#### Processing

The service will match all messages which location falls within the defined polygon and time range. 

#### Response

The endpoint returns HTTP 400 status code when the submitted query is invalid. The body of the response contains details of the error. This includes a case when the number of matching messages exceeds the limit set on the server using the `W3_MAX_QUERY_LIMIT` environment variable (set based on WAWS app settings), or 200 by default. In the case of exceeded limit the response body will be `Number of query results exceeded the limit.`.

The endpoint returns HTTP 500 status code when querying the database fails. The body of the response contains details of the error.

The endpoint returns HTTP 200 status code when the query was successful. The body of the HTTP response in that case contains `application/json` representation of the array representing query results. For example, given the following request:

```
{
    "geometry": {
        "type": "Polygon",
        "coordinates": [[[-122,49], [-118,49], [-118,51], [-122,51], [-122,49]]]
    },
    "time": {
        "type": "Period",
        "time": [ 1371500000000, 1403222500000 ]
    }
}
```

The result (depending on the content of the databse) may look like this:

```
[
  {
    "created": 1371702899272,
    "text": "Test message $(-120,50: My favorite fishing spot) $(20,20: My second best) ^(2013-06-19) ^(2014-06-20) #fishing /cc @theworld @tjanczuk",
    "tags": [
      "fishing"
    ],
    "people": [
      "theworld",
      "tjanczuk"
    ],
    "location": {
      "type": "Point",
      "coordinates": [
        -120,
        50
      ]
    },
    "location_name": "My favorite fishing spot",
    "time": {
      "type": "Moment",
      "time": [
        1371600000000
      ]
    },
    "version": "0.0.1",
    "id": "51c28674de8c929441000003"
  },
  {
    "created": 1371702899272,
    "text": "Test message $(-120,50: My favorite fishing spot) $(20,20: My second best) ^(2013-06-19) ^(2014-06-20) #fishing /cc @theworld @tjanczuk",
    "tags": [
      "fishing"
    ],
    "people": [
      "theworld",
      "tjanczuk"
    ],
    "location": {
      "type": "Point",
      "coordinates": [
        -120,
        50
      ]
    },
    "location_name": "My favorite fishing spot",
    "time": {
      "type": "Moment",
      "time": [
        1403222400000
      ]
    },
    "version": "0.0.1",
    "id": "51c28674de8c929441000004"
  }
]
```

## Tips and tricks

Run the server at localhost:3000 during development (MacOS):

```
sudo W3_MONGO_URL=mongodb://w3:cdd66d02385c4ed19177d1d4247735b8@dharma.mongohq.com:10033/w3 ./rundev
```

Connect to the Mongo DB from command line (requires MongoDB client):

```
mongo dharma.mongohq.com:10033/w3 -u w3 -p cdd66d02385c4ed19177d1d4247735b8
```

Post a message from the `message1.txt` file to the system listening on `http://localhost:3000` from command line:

```
curl http://localhost:3000/api/v1/messages --data-binary @message1.txt
```

The same to the production system:

```
curl http://w3.surla.mobi/api/v1/messages --data-binary @message1.txt
```

To issue a query in `query1.json` file to the system listening on `http://localhost:3000` from command line:

```
curl http://localhost:3000/api/v1/query --header "Content-Type: application/json" --data-binary @query1.json
```

The same query issued to production system:

```
curl http://w3.surla.mobi/api/v1/query --header "Content-Type: application/json" --data-binary @query1.json
```