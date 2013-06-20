exports.mongoUrl = process.env.W3_MONGO_URL;
exports.mongoPoolSize = +(process.env.W3_MONGO_POOL_SIZE || 5);
exports.maxQueryLimit = +(process.env.W3_MAX_QUERY_LIMIT || 200);
