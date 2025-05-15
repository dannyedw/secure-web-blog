
const { pool } = require("./connectionPool");
const { secureRandomCode } = require("../helpers/generateRandomCode");

let mfasecrets = {};
exports.mfasecrets = mfasecrets;

const GENERIC_CLIENT_ERRMSG = "something went wrong";

mfasecrets.set = async (username, secret) => {
    let result = { success: false, clientErrMsg: "" };

    try
    {
        const query = "INSERT INTO mfasecrets (username, secret, time) VALUES ($1, pgp_sym_encrypt($2, $3), CURRENT_TIMESTAMP) ON CONFLICT(username) DO UPDATE SET secret = pgp_sym_encrypt($2, $3), time = CURRENT_TIMESTAMP";
        const values = [username, secret, process.env.DATABASE_ENCRYPTION_KEY];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("user setMFASecret: query error: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
};

mfasecrets.get = async (username) => {
    let result = { success: false, clientErrMsg: "", secret: "" };

    let queryResult;
    try
    {
        const query = "SELECT time, pgp_sym_decrypt(secret, $2) as secret FROM mfasecrets WHERE username = $1";
        const values = [username, process.env.DATABASE_ENCRYPTION_KEY];
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error("user getMFASecret: query error: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    if (queryResult.rowCount > 0)
    {
        //check if secret has expired, and if so make a new one. the newly returned one won't match what the user has,
        //so they will need to re enter email code
        const timestampSecret = Date.parse(queryResult.rows.at(0).time);
        if (timestampSecret == NaN)
        {
            console.error("mfasecrets get: timestamp was NaN");
            result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
            return result;
        }

        const timestampNow = Date.now();
        if (timestampNow - timestampSecret >  process.env.MFA_SECRET_MAX_AGE)
        {
            //secret has expired, make a new one
            const newSecret = secureRandomCode();
            const setResult = await mfasecrets.set(username, newSecret);
            if (!setResult.success)
            {
                result.clientErrMsg = setResult.clientErrMsg;
                return result;
            }

            result.secret = newSecret;
        }
        else
        {
            result.secret = queryResult.rows.at(0).secret;
        }
    }

    //if mfa not enabled, result.secret stays as ""
   
    result.success = true;
    return result;
};

