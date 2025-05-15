
const router = require('express').Router();
const path = require('path');

const { database } = require('../database/database')
const { verifyEmail } = require("../helpers/emailVerification");
const { regenerateSession } = require("../helpers/regenerateSession");


router.get("/", (req, res) => {
    if (req.session.user)
    {
        if (req.session.emailVerified)
        {
            //user is logged in, cannot log in again so redirect
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
        res.sendFile(path.join(__dirname, "../public/html/signup.html"));
    }
});

router.post("/", async (req, res) => {
    if (req.session.user)
    {
        //user logged in, cannot log in again so tell them off
        res.status(400).json("already signed in");
    }
    else
    {
        const dbResult = await database.user.signup(req.body.username, req.body.firstName, req.body.lastName,
            req.body.email, req.body.password);

        req.body.password = undefined; //best to not have it in memory any more than necessary
        
        if (!dbResult.success)
        {
            //signup failed, inform client
            res.status(400).json(dbResult.clientErrMsg);
            return;
        }

        //user details successfully added to database, begin email validation
        const veResult = await verifyEmail.generate(req.body.username);
        if (!veResult.success)
        {
            res.status(400).json(veResult.clientErrMsg);
            return;
        }

        const regenSessionResult = await regenerateSession(req, res);
        if (!regenSessionResult.success)
        {
            //signin failed, inform client
            res.status(400).json(regenSessionResult.clientErrMsg);
            console.error("signup: error regenerating session: ", err);
            return;
        }
        
        req.session.user = req.body.username;
        res.cookie("signedin", true);

        //redirect user to verification page
        res.status(200).redirect("/checkemail/signup");
    }    
});

module.exports = router;