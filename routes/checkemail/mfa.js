
const router = require('express').Router();
const path = require("path");

const { mfa } = require("../../helpers/mfa");


router.get("/", (req, res) => {
    if (!req.session.mfauser || !req.session.emailVerified)
    {
        //not signed in or haven't finished email verification
        res.redirect("/");
    }
    else
    {
        res.sendFile(path.join(__dirname, "../../public/html/checkemail_mfa_signin.html"));
    }
});

router.post("/", async (req, res) => {
    if (!req.session.mfauser)
    {
        //not in mfa signin process, cannot submit a code
        res.status(400).json("something went wrong");
        return;
    }
    
    if (!req.session.mfaEnabled)
    {
        //user does not have mfa enabled, shouldnt be here
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
    const checkResult = await mfa.checkCode(req.session.mfauser, req.body.code);
    if (!checkResult.success)
    {
        res.status(400).json(checkResult.clientErrMsg);
        return;
    }

    //it does match
    //remove the code
    mfa.revoke(req.session.mfauser);

    //set the user as fully signed in
    req.session.user = req.session.mfauser;
    
    //give them a cookie so they don't need to enter a code for a period of time
    const secretResult = await mfa.getSecret(req.session.mfauser);
    if (!secretResult.success)
    {
        res.status(400).json(secretResult.clientErrMsg);
        return;
    }

    res.cookie("mfaSecret", secretResult.secret, {maxAge: process.env.MFA_SECRET_MAX_AGE});
    const prevPage = req.session.prevPage;
    delete req.session.prevPage;
    delete req.session.mfauser;
    
    res.status(200).redirect(prevPage || "/");
});


module.exports = router;