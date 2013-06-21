exports.mongoUrl = process.env.W3_MONGO_URL;
exports.mongoPoolSize = +(process.env.W3_MONGO_POOL_SIZE || 5);
exports.maxQueryLimit = +(process.env.W3_MAX_QUERY_LIMIT || 200);
exports.maxMessageSize = +(process.env.W3_MAX_MESSAGE_SIZE || 140);
exports.maxQuerySize = +(process.env.W3_MAX_QUERY_SIZE || 1024);