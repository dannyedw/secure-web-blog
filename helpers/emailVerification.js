
const { database } = require("../database/database")
const { emailSender } = require("./emailSender");
const { simpleRandomCode } = require("./generateRandomCode");

let verifyEmail = {};

verifyEmail.generate = async (username) => {
    //set a validation code for the email provided, and create and send an email to the address with a link containing
    //the code. codes are only valid for a short time (TODO), and require the user to already be logged in with a
    //session with the account the email address is attached to. Therefore, the number generated does not need to be
    //cryptographically secure or long.

    let result = { success: false, clientErrMsg: "" };

    //generate code and assign to current user
    let code = simpleRandomCode();
    let dbResult = await database.emailCode.verifyEmail.set(username, code);
    if (!dbResult.success)
    {
        result.clientErrMsg = dbResult.clientErrMsg;
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
    emailSender.sendSignupLink(email, `http://localhost:8080/verifyemail/${code}`);
    
    result.success = true;
    return result;
};

verifyEmail.revoke = async (username) => {
    //remove the email code entry so it can no longer be used for verification

    let result = { success: false, clientErrMsg: "" };

    let dbResult = await database.emailCode.verifyEmail.remove(username);
    if (!dbResult.success)
    {
        result.clientErrMsg = dbResult.clientErrMsg;
        return result;
    }

    result.success = true;
    return result;
};

verifyEmail.checkCode = async (username, code) => {
    //check the provided code matches with the email associated with the currently logged in account
    
    let result = { success: false, clientErrMsg: "" };

    const dbResult = await database.emailCode.verifyEmail.check(username, code);
    if (!dbResult.success)
    {
        result.clientErrMsg = dbResult.clientErrMsg;
        return result;
    }

    result.success = true;
    return result;
};

verifyEmail.setUserVerified = async (username) => {
    let result = { success: false, clientErrMsg: "" };

    //set the user's verified value to true in user table
    let dbResult = await database.user.setVerified(username);
    if (!dbResult.success)
    {
        result.clientErrMsg = dbResult.clientErrMsg;
        return result;
    }

    //remove the emailcode entry from the codes table
    dbResult = await database.emailCode.verifyEmail.remove(username);
    if (!dbResult.success)
    {
        result.clientErrMsg = dbResult.clientErrMsg;
        return result;
    }

    result.success = true;
    return result;
};


exports.verifyEmail = verifyEmail;