const MySQLNode = require('./nodes/mysql.node');
const MySQLDbCredentials = require('./credentials/mysqlDb.credentials');

module.exports = {
  node: MySQLNode,
  credentials: MySQLDbCredentials
};
