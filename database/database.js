
const { user } = require("./user");
const { post } = require("./post");
const { emailCode } = require("./emailcode");
const { mfasecrets } = require("./mfasecrets");
const { pool } = require("./connectionPool"); //only used here for test connection


//group functions by categories into objects, and export the object (easier and clearer than exporting/requiring every
//individual function)
let database = {
    user: user,
    post: post,
    emailCode: emailCode,
    mfasecrets: mfasecrets,
    testConnection: testConnection };
exports.database = database;

async function testConnection()
{
    try
    {
        await pool.connect();
        console.log("connected to database");
        return true;
    }
    catch (err)
    {
        console.error("error connecting to database: ", err);
        console.error("ensure servce 'postgresql-x64-16' is running (run startdatabase.bat)");
        return false;
    }
}
