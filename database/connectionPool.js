
//https://scalegrid.io/blog/how-to-connect-postgresql-database-in-node-js/
const { Pool } = require("pg");
require("dotenv").config(); // Needed for test harness so comment if stuff brakes

const pool = new Pool({
    user: process.env.DATABASE_USERNAME,
    host: "localhost",
    database: "DSS blog database",
    password: process.env.DATABASE_PASSWORD,
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000
});

exports.pool = pool;