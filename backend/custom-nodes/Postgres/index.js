const PostgresNode = require('./nodes/postgres.node');
const PostgresDbCredentials = require('./credentials/postgresDb.credentials');

module.exports = {
  node: PostgresNode,
  credentials: PostgresDbCredentials
};
