const { Pool, types } = require("pg");

const database = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

types.setTypeParser(1114, (value) => {
  return value;
});

types.setTypeParser(1082, (value) => {
  return value;
});

module.exports = database;
