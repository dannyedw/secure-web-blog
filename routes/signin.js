
const router = require('express').Router();
const path = require('path');
const { rateLimit } = require("express-rate-limit");

const { database } = require('../database/database');
const { regenerateSession } = require("../helpers/regenerateSession");
const { mfa } = require("../helpers/mfa");

//rate limiting
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false
});


router.get("/", (req, res) => {
    if (req.session.user)
    {
        if (req.session.emailVerified)
        {
            //already signed in, redirect to home
            res.redirect("/");
        }
        else
        {
            if (req.session.accountActivated)
            {
                res.redirect("/checkemail/changedemail");
            }
            else
            {
                res.redirect("/checkemail/signup");
            }
        }
    }
    else
    {
        res.sendFile(path.join(__dirname, "../public/html/signin.html"));
    }
});

router.post("/", rateLimiter, async (req, res) => {
    if (req.session.user)
    {
        //user logged in, cannot log in again so tell them off
        res.status(400).json("already signed in");
        return;
    }

    const signinResult = await database.user.signin(req.body.username, req.body.password);
    req.body.password = undefined; //best to not have it in memory any more than necessary
    if (!signinResult.success)
    {
        //signin failed, inform client
        res.status(400).json(signinResult.clientErrMsg);
        return;
    }

    //begin login session. generate a new session id to defend against session fixation
    //save old session for transferring prevpage (if it existed)
    const regenSessionResult = await regenerateSession(req, res);
    if (!regenSessionResult.success)
    {
        res.status(400).json(regenSessionResult.clientErrMsg);
        return;
    }

    const verifiedResult = await database.user.checkVerified(req.body.username);
    if (!verifiedResult.success)
    {
        res.status(400).json(verifiedResult.clientErrMsg);
        return;
    }

    req.session.emailVerified = verifiedResult.verified;

    //check if user has finished activating their account by verifying email (used to distinguish between initial signup
    //email verification and when changing email)
    const activatedResult = await database.user.checkActivated(req.body.username);
    if (!activatedResult.success)
    {
        res.status(400).json(activatedResult.clientErrMsg);
        return;
    }

    req.session.accountActivated = activatedResult.activated;

    //check if user has mfa enabled, and if they do, check if it has expired or not
    const mfaResult = await database.mfasecrets.get(req.body.username);
    if (!mfaResult.success)
    {
        res.status(400).json(mfaResult.clientErrMsg);
        return;
    }

    if (mfaResult.secret == "")
    {
        //mfa has not been set up, can log in with just username and password
        //redirect user to previous page they were on before being asked to sign in (or default to home)
        req.session.user = req.body.username;
        req.session.emailVerified = verifiedResult.verified;
        res.cookie("signedin", true);
        const prevPage = req.session.prevPage;
        delete req.session.prevPage;
        res.status(200).redirect(prevPage || "/");
        return;
    }

    //mfa is enabled, check if provided secret in cookie matches what is stored
    req.session.mfaEnabled = true;
    if (req.cookies.mfaSecret == mfaResult.secret)
    {
        //codes match, allow sign in
        //redirect user to previous page they were on before being asked to sign in (or default to home)
        req.session.user = req.body.username;
        res.cookie("signedin", true);
        const prevPage = req.session.prevPage;
        delete req.session.prevPage;
        res.status(200).redirect(prevPage || "/");
    }
    else
    {
        //send email with new code
        const generateResult = await mfa.generate(req.body.username);
        if (!generateResult.success)
        {
            res.status(400).json(generateResult.clientErrMsg);
            return;
        }

        //redirect to page to enter code
        //temp variable to be used when checking mfa code. different to regular session.user, since that having a
        //value means the user is fully signed in
        req.session.mfauser = req.body.username;
        res.status(200).redirect("/checkemail/mfa");
    }
});

module.exports = router;