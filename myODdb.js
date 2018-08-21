var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : '142.93.86.123',
  user            : 'root',
  password        : '123hi123',
  database        : 'justgame'
});
module.exports.pool = pool;