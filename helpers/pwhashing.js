
const argon2 = require("argon2");

//https://github.com/ranisalt/node-argon2/wiki/Options
const options = {
    type: argon2.argon2i, //supposed most appropriate for passwords
    secret: Buffer.from("AxB6GKdGo!9sNrZJn&wV!tvw&S%gebue#%LUDRSnz2N882nh") //pepper value (salt is included automatically by argon) TODO: store in environment variable
}

async function hash(plainPassword)
{
    let result = { success: false, hash: "" };

    try
    {
        result.hash = await argon2.hash(plainPassword, options);
        result.success = true;
        return result;
    }
    catch (err)
    {
        console.error("error hashing password: ", err);
        return result;
    }
}

async function verify(hashedPassword, plainPassword)
{
    let result = { success: false, matched: false };

    try
    {
        result.matched = await argon2.verify(hashedPassword, plainPassword, options);
        result.success = true;
        return result;
    }
    catch (err)
    {
        console.error("error verifying password hash: ", err);
        return result;
    }
}

exports.pwHash = hash;
exports.pwVerify = verify;