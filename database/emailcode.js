
const { pool } = require("./connectionPool");


let emailCode = {};
emailCode.verifyEmail = {};
emailCode.mfa = {};
exports.emailCode = emailCode;

const GENERIC_CLIENT_ERRMSG = "something went wrong";

emailCode.verifyEmail.set = async (username, code) => {
    return await set("verifyemail", username, code); //easier interface to not have to manually specify type
};

emailCode.verifyEmail.check = async (username, code) => {
    return await check("verifyemail", username, code);
};

emailCode.verifyEmail.remove = async (username) => {
    return await remove("verifyemail", username);
};


emailCode.mfa.set = async (username, code) => {
    return await set("mfa", username, code);
};

emailCode.mfa.check = async (username, code) => {
    return await check("mfa", username, code);
};

emailCode.mfa.remove = async (username) => {
    return await remove("mfa", username);
};


async function set(type, username, code)
{
    let result = { success: false, clientErrMsg: "" };

    let query;
    switch (type)
    {
        case "verifyemail": //could have type be the name of the table and place directly in query, but hesitant to allow potentially any value to be put in
            query = "INSERT INTO emailverifycodes (username, code) VALUES ($1, $2) ON CONFLICT(username) DO UPDATE SET code = $2";
            break;

        case "mfa":
            query = "INSERT INTO mfacodes (username, code) VALUES ($1, $2) ON CONFLICT(username) DO UPDATE SET code = $2";
            break;

        default:
            console.error(`emailCode set: invalid code type: ${type}`);
            result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
            return result;
    }
    
    try
    {
        const values = [username, code];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error(`emailCode set (type: ${type}): error inserting: `, err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
}

async function check(type, username, code)
{
    let result = { success: false, clientErrMsg: "" };

    let query;
    switch (type)
    {
        case "verifyemail":
            query = "SELECT COUNT(*) FROM emailverifycodes WHERE username = $1 AND code = $2";
            break;

        case "mfa":
            query = "SELECT COUNT(*) FROM mfacodes WHERE username = $1 AND code = $2";
            break;

        default:
            console.error(`emailCode check: invalid code type: ${type}`);
            result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
            return result;
    }

    let queryResult;
    try
    {
        const values = [username, code];
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error(`emailCode check (type: ${type}): query error: `, err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    if (queryResult.rows.at(0).count != 1)
    {
        //no entries found with this email and code combination
        result.clientErrMsg = "invalid code";
        return result;
    }

    result.success = true;
    return result;
}

async function remove(type, username)
{
    let result = { success: false, clientErrMsg: "" };

    let query;
    switch (type)
    {
        case "verifyemail":
            query = "DELETE FROM emailverifycodes WHERE username = $1";
            break;

        case "mfa":
            query = "DELETE FROM mfacodes WHERE username = $1";
            break;

        default:
            console.error(`emailCode remove: invalid code type: ${type}`);
            result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
            return result;
    }

    try
    {
        const values = [username];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("emailcode verifyemail remove: query error: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
}