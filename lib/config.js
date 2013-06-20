exports.mongoUrl = process.env.W3_MONGO_URL;
exports.mongoPoolSize = +(process.env.W3_MONGO_POOL_SIZE || 5);
