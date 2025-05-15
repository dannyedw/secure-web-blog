
const { database } = require("../database/database")
const { emailSender } = require("./emailSender");
const { simpleRandomCode, secureRandomCode } = require("./generateRandomCode");

let mfa = {};

mfa.generate = async (username) => {
    let result = { success: false, clientErrMsg: "" };

    //generate code and assign to current user
    const code = simpleRandomCode();

    const mfaResult = await database.emailCode.mfa.set(username, code);
    if (!mfaResult.success)
    {
        result.clientErrMsg = mfaResult.clientErrMsg;
        return result;
    }

    //get the email address associated with the username
    const detailsResult = await database.user.getDetails(username);
    if (!detailsResult.success)
    {
        result.clientErrMsg = detailsResult.clientErrMsg;
        return result;
    }

    const email = detailsResult.details.email;

    //create email to send to user
    emailSender.sendMFACode(email, code);
    
    result.success = true;
    return result;
};

mfa.revoke = async (username) => {
    //remove the email code entry so it can no longer be used for verification

    let result = { success: false, clientErrMsg: "" };

    const removeResult = await database.emailCode.mfa.remove(username);
    if (!removeResult.success)
    {
        result.clientErrMsg = removeResult.clientErrMsg;
        return result;
    }

    result.success = true;
    return result;
};

mfa.checkCode = async (username, code) => {
    //check the provided code matches with the email associated with the currently logged in account
    
    let result = { success: false, clientErrMsg: "" };

    const checkResult = await database.emailCode.mfa.check(username, code);
    if (!checkResult.success)
    {
        result.clientErrMsg = checkResult.clientErrMsg;
        return result;
    }

    result.success = true;
    return result;
};

mfa.getSecret = async (username) => {
    //mfa module acts as helper to interface with database functions, but the database function already does everything
    //we need
    return await database.mfasecrets.get(username);
};

mfa.setSecret = async (username, secret) => {
    return await database.mfasecrets.set(username, secret);
};


exports.mfa = mfa;