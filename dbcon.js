var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_siom',
  password        : '3150',
  database        : 'cs340_siom'
});
module.exports.pool = pool;