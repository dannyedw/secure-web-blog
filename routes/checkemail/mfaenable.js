
const router = require('express').Router();
const path = require("path");

const { mfa } = require("../../helpers/mfa");
const { secureRandomCode } = require("../../helpers/generateRandomCode");


router.get("/", (req, res) => {
    if (!req.session.user || !req.session.emailVerified || req.session.mfaEnabled)
    {
        //not signed in or haven't finished email verification
        res.redirect("/");
    }
    else
    {
        res.sendFile(path.join(__dirname, "../../public/html/checkemail_mfa_enable.html"));
    }
});

router.post("/", async (req, res) => {
    if (!req.session.user || !req.session.emailVerified)
    {
        //not signed in or haven't finished email verification, cannot set up mfa
        res.status(400).json("user must be signed in to perform that action");
        return;
    }

    if (req.session.mfaEnabled)
    {
        //mfa already enabled, cannot enable it again
        res.status(400).json("something went wrong");
        return;
    }

    //some validity checks on submitted code
    if (req.body.code == null)
    {
        res.status(400).json("no code was submitted");
        return;
    }

    if (req.body.code.length != 6)
    {
        res.status(400).json("invalid code");
        return;
    }

    //check if the submitted code matches the stored value in the database
    const checkResult = await mfa.checkCode(req.session.user, req.body.code);
    if (!checkResult.success)
    {
        res.status(400).json(checkResult.clientErrMsg);
        return;
    }

    //it does match
    //remove the code
    mfa.revoke(req.session.user);
    
    //generate the mfa secret which can be used to bypass mfa when recently used to sign in
    //this should change after 30 days
    const mfaSecret = secureRandomCode();
    const mfaSecretResult = await mfa.setSecret(req.session.user, mfaSecret);
    if (!mfaSecretResult.success)
    {
        res.status(400).json(mfaSecretResult);
        return;
    }

    //give them a cookie with the secret so they don't need to enter a code for a period of time
    res.cookie("mfaSecret", mfaSecret, {maxAge: process.env.MFA_SECRET_MAX_AGE});

    res.status(200).redirect("/account");
});


module.exports = router;