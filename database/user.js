
const { pool } = require("./connectionPool");
const { compromisedpasswords } = require("./compromisedpasswords");
const { pwHash, pwVerify } = require("../helpers/pwhashing");


let user = {};
exports.user = user;

const GENERIC_CLIENT_ERRMSG = "something went wrong";

user.signup = async (username, firstname, lastname, email, plainPassword) => {
    let result = { success: false, clientErrMsg: "" };    

    //TODO: check if username satisfies requirements (length, character types etc.)

    //check if username already exists
    let usernameResult = await isUsernameAvailable(username);
    if (!usernameResult.success)
    {
        result.clientErrMsg = usernameResult.clientErrMsg;
        return result;
    }

    //check password length
    if (plainPassword.length < 8)
    {
        result.clientErrMsg = "password is too short, please enter at least 8 characters";
        return;
    }

    // Check password against compromised ones
    let checkPassword = await compromisedpasswords.check(plainPassword);
    // fail if pw in compromised table
    if (!checkPassword.success)
    {
        result.clientErrMsg = checkPassword.clientErrMsg;
        return result;
    }

    //TODO: check if password satisfies requirements (length, character types etc.)

    //hash password
    const hashResult = await pwHash(plainPassword);
    if (!hashResult.success)
    {
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    const securedPassword = hashResult.hash;

    //add to database
    try
    {
        //encrypt sensitive info so it cannot be easily obtained if the database is leaked
        //usernames are already public, and password is hashed so not worth encrypting
        //would make more sense to have a postgres function for taking in the values and encrypting them, but not much
        //time to implement and test that. would need a function for every query we have.
        const query = "INSERT INTO users (username, password, first_name, last_name, email) VALUES($1, $2, pgp_sym_encrypt($3, $6), pgp_sym_encrypt($4, $6), pgp_sym_encrypt($5, $6));";
        const values = [username, securedPassword, firstname, lastname, email, process.env.DATABASE_ENCRYPTION_KEY];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("userCreate: error inserting new user: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    //everything succeeded
    result.success = true;
    return result;
};

user.signin = async (username, plainPassword) => {
    let result = { success: false, clientErrMsg: "" };

    //wait random amount of time to defend against timing attacks
    await randomDelay(2000);

    //check if username and password combination exist
    const verifyResult = await verifyPassword(username, plainPassword);
    if (!verifyResult.success)
    {
        //error occurred when checking password
        result.clientErrMsg = verifyResult.clientErrMsg;
        return result;
    }

    //username and password match an entry in the users table, let them in
    result.success = true;
    return result;
};

user.setVerified = async (username) => {
    let result = { success: false, clientErrMsg: "" };

    try
    {
        const query = "UPDATE users SET email_verified = true WHERE username = $1";
        const values = [username];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("user setVerified: query error: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
};

user.checkVerified = async (username) => {
    let result = { success: false, clientErrMsg: "", verified: false };
    
    let queryResult;
    try
    {
        const query = "SELECT email_verified FROM users WHERE username = $1";
        const values = [username];
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error("user checkVerified: query error: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.verified = queryResult.rows.at(0).email_verified;
    result.success = true;
    return result;
};

user.setActivated = async (username) => {
    let result = { success: false, clientErrMsg: "" };

    try
    {
        const query = "UPDATE users SET account_activated = true WHERE username = $1";
        const values = [username];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("user setActivated: query error: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
};

user.checkActivated = async (username) => {
    let result = { success: false, clientErrMsg: "", activated: false };
    
    let queryResult;
    try
    {
        const query = "SELECT account_activated FROM users WHERE username = $1";
        const values = [username];
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error("user checkActivated: query error: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.activated = queryResult.rows.at(0).account_activated;
    result.success = true;
    return result;
};

user.getDetails = async (username) => {
    let result = { success: false, clientErrMsg: "", details: {} };

    let queryResult;
    try
    {
        const query = "SELECT username, pgp_sym_decrypt(first_name, $2) as first_name, pgp_sym_decrypt(last_name, $2) as last_name, pgp_sym_decrypt(email, $2) as email FROM users WHERE username = $1";
        const values = [username, process.env.DATABASE_ENCRYPTION_KEY];
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error("user getDetails: error selecting values: ", err);
        result.clientErrMsg = "error getting user details";
        return result;
    }

    result.details = queryResult.rows.at(0);
    result.success = true;
    
    return result;
};

user.update = async (username, field, value, plainPassword) => {
    let result = { success: false, clientErrMsg: "", newSessionUser: null, newEmail: false };

    //check field being changed is valid, and call relevant helper function
    field = field.toLowerCase();
    let updateResult;
    switch (field)
    {
        case "username":
            updateResult = await updateUsername(username, value, plainPassword);
            if (updateResult.success)
            {
                //new username wants the session to be regenerated
                result.newSessionUser = value;
            }
            break;

        case "password":
            updateResult = await updatePassword(username, value, plainPassword);
            if (updateResult.success)
            {
                //new password wants session to be regenerated
                result.newSessionUser = username;
            }
            break;

        case "first_name":
            updateResult = await updateFirstname(username, value);
            break;

        case "last_name":
            updateResult = await updateLastname(username, value);
            break;

        case "email":
            updateResult = await updateEmail(username, value, plainPassword);
            if (updateResult.success)
            {
                result.newEmail = true;
            }
            break;

        default:
            result.clientErrMsg = "invalid field";
            return result;
    }

    if (!updateResult.success)
    {
        result.clientErrMsg = updateResult.clientErrMsg;
        return result;
    }
    
    //value updated successfully
    result.success = true;
    return result;
};

user.delete = async (username) => {
    //consider requiring password check here

    let result = { success: false, clientErrMsg: "" };

    try
    {
        const query = "DELETE FROM users WHERE username = $1";
        const values = [username];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("userDelete: error deleting user: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
};


async function updateUsername(oldUsername, newUsername, plainPassword)
{
    let result = { success: false, clientErrMsg: "" };

    if (plainPassword == null)
    {
        result.clientErrMsg = "password is required to update this field";
        return result;
    }

    //check if username and password combination exist with old password
    const verifyResult = await verifyPassword(oldUsername, plainPassword);
    if (!verifyResult.success)
    {
        //error occurred when checking password
        result.clientErrMsg = verifyResult.clientErrMsg;
        return result;
    }

    //check username is valid
    //is it already taken
    let usernameResult = await isUsernameAvailable(newUsername);
    if (!usernameResult.success)
    {
        result.clientErrMsg = usernameResult.clientErrMsg;
        return result;
    }
    
    //TODO: does it fit the requirements


    //update username
    try
    {
        const query = "UPDATE users SET username = $1 WHERE username = $2";
        const values = [newUsername, oldUsername];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("updateUsername: error updating: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
}

async function updatePassword(username, newPassword, oldPassword)
{
    let result = { success: false, clientErrMsg: "" };

    if (oldPassword == null)
    {
        result.clientErrMsg = "password is required to update this field";
        return result;
    }

    // Check newpassword against compromised ones
    let checkPassword = await compromisedpasswords.check(newPassword);
    // fail if pw in compromised table
    if (!checkPassword.success)
    {
        result.clientErrMsg = checkPassword.clientErrMsg;
        return result;
    }

    //check if username and password combination exist with old password
    const verifyResult = await verifyPassword(username, oldPassword);
    if (!verifyResult.success)
    {
        //error occurred when checking password
        result.clientErrMsg = verifyResult.clientErrMsg;
        return result;
    }

    //TODO: check new password satisfies requirements

    //hash new password
    const hashResult = await pwHash(newPassword);
    if (!hashResult.success)
    {
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    const securedPassword = hashResult.hash;

    //update the password
    try
    {
        const query = "UPDATE users SET password = $1 WHERE username = $2";
        const values = [securedPassword, username];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("updatePassword: error updating: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
}

async function updateFirstname(username, firstname)
{
    let result = { success: false, clientErrMsg: "" };

    //TODO: check name is valid

    //update firstname
    try
    {
        const query = "UPDATE users SET first_name = pgp_sym_encrypt($1, $3) WHERE username = $2";
        const values = [firstname, username, process.env.DATABASE_ENCRYPTION_KEY];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("updateFirstname: error updating: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
}

async function updateLastname(username, lastname)
{
    let result = { success: false, clientErrMsg: "" };

    //TODO: check name is valid

    //update lastname
    try
    {
        const query = "UPDATE users SET last_name = pgp_sym_encrypt($1, $3) WHERE username = $2";
        const values = [lastname, username, process.env.DATABASE_ENCRYPTION_KEY];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("updateLastname: error updating: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
}

async function updateEmail(username, email, plainPassword)
{
    let result = { success: false, clientErrMsg: "" };

    //check password is provided and correct
    if (plainPassword == null)
    {
        result.clientErrMsg = "password is required to update this field";
        return result;
    }

    //check if username and password combination exist
    const verifyResult = await verifyPassword(username, plainPassword);
    if (!verifyResult.success)
    {
        //error occurred when checking password
        result.clientErrMsg = verifyResult.clientErrMsg;
        return result;
    }

    //update email
    try
    {
        const query = "UPDATE users SET email = pgp_sym_encrypt($1, $3) WHERE username = $2";
        const values = [email, username, process.env.DATABASE_ENCRYPTION_KEY];
        await pool.query(query, values);
    }
    catch (err)
    {
        console.error("updateEmail: error updating: ", err);
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    return result;
}

async function isUsernameAvailable(username)
{
    let result = { success: false, clientErrMsg: "" };

    let queryResult;
    try
    {
        const query = "SELECT COUNT(*) FROM users WHERE username = $1";
        const values = [username];
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error("userLogin: error attempting username count: ", err)
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    const count = queryResult.rows.at(0).count;
    if (count != 0)
    {
        //username already exists (or somehow some other incorrect value has occurred).
        //this gives away that a user with this account exists which could be used in account enumeration, but is too
        //important a usability aspect to not tell the user about
       result.clientErrMsg = "username taken";
       return result;
    }

    result.success = true;
    return result;
}

async function getHashedPassword(username)
{
    let result = { success: false, clientErrMsg: "", hash: "" };

    let queryResult;
    try
    {
        const query = "SELECT password FROM users WHERE username = $1";
        const values = [username];
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error("getHashedPassword: error selecting password: ", err)
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    if (queryResult.rowCount === 0)
    {
        //no user with this username exists
        result.clientErrMsg = "invalid username or password";
        return result;
    }
    
    if (queryResult.rowCount > 1)
    {
        //panic
        console.error("more than one user exists with a given username (this should never happen)");
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    result.success = true;
    result.hash = queryResult.rows.at(0).password;
    return result;
}

async function verifyPassword(username, plainPassword)
{
    let result = { success: false, clientErrMsg: "" };

    const getPasswordResult = await getHashedPassword(username);
    if (!getPasswordResult.success)
    {
        //either username didnt exist, or an error occurred (error will be logged by getHashedPassword)
        result.clientErrMsg = getPasswordResult.clientErrMsg;
        return result;
    }

    const storedHash = getPasswordResult.hash;
    const verifyResult = await pwVerify(storedHash, plainPassword);

    if (!verifyResult.success)
    {
        //an error ocurred when trying to verify (will be printed to log by pwVerify)
        result.clientErrMsg = GENERIC_CLIENT_ERRMSG;
        return result;
    }

    if (!verifyResult.matched)
    {
        //the provided password does not produce the same hash so is incorrect
        result.clientErrMsg = "invalid username or password";
        return result;
    }

    result.success = true;
    return result;
}

function randomDelay(maxMilliseconds)
{
    //https://stackoverflow.com/questions/14249506/how-can-i-wait-in-node-js-javascript-l-need-to-pause-for-a-period-of-time
    return new Promise((resolve) => {
        const delay = Math.floor(Math.random() * maxMilliseconds);
        setTimeout(resolve, delay);
    });
}