What Where When
===

[http://w3.surla.mobi](http://w3.surla.mobi)  

# REST APIs

## Posting messages

To post new messages to the system, use this endpoint:

```
POST /api/v1/messages
```

Currently the endpoint is not authenticated, but it will be.

### Request body 

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

### Request processing

The service validates and normalizes the request by generating a a the cross-product of all locations and times specified in the message. Each entry in that cross-product is specific to a single location and single moment in time. The resulting array of entries is inserted into the Mongo databse. In case of the sample request above, four entries would be generated. 

### Response

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
    "_id": "51c28200e345dc7f22000012"
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
    "_id": "51c28200e345dc7f22000013"
  }
]      
```

# Tips and tricks

Connect to the Mongo DB from command line:

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