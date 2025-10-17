const MongoDBNode = require('./nodes/mongodb.node');
const MongoDbCredentials = require('./credentials/mongoDb.credentials');

module.exports = {
  node: MongoDBNode,
  credentials: MongoDbCredentials
};
