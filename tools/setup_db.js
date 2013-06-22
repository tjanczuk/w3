/*
This script sets up MongoDB with indexes required by W3
*/

db.messages.ensureIndex({ location: "2dsphere", "time.time": 1 })
printjson(db.messages.getIndexes())
