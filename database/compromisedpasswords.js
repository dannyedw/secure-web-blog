
const { pool } = require("./connectionPool");


let compromisedpasswords = {};
exports.compromisedpasswords = compromisedpasswords;

const GENERIC_CLIENT_ERRMSG = "something went wrong";

// Check passwords in database table
compromisedpasswords.check = async (password) => {
    let result = { success: false, clientErrMsg: "", details: {} };

    let queryResult;
    try
    {
        const query = "SELECT passwords FROM compromisedpasswords WHERE passwords = $1";
        const values = [password];
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error("compPasswords: error selecting values: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    // PW not in compromised list so all good?
    if(queryResult.rowCount > 0)
    {
        result.clientErrMsg = "password is compromised";
        return result;
    }

    result.success = true;
    return result;
};