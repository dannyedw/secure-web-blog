
const crypto = require("crypto");

function simple()
{
    //used for email verification and mfa, wants to be easy to type and rememeher
    return Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
}

function secure()
{
    //used for mfa secret, csrf token and reset password link, so must be harder to guess
    const num = crypto.randomInt(10000000000);
    return crypto.createHash('sha256').update(num.toString()).digest('hex');
}

exports.simpleRandomCode = simple;
exports.secureRandomCode = secure;