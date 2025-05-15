
const router = require('express').Router();

const { database } = require('../database/database');
const { verifyEmail } = require("../helpers/emailVerification")


router.get("/:emailCode", async (req, res) => {
    if (!req.session.user)
    {
        //user not logged in, may have clicked email link after logging out. make them log in and then send them to the
        //verification page
        if (req.params.emailCode)
        {
            //user was trying to use an email code while not logged in, prompt them to login
            req.session.prevPage = `/verifyemail/${req.params.emailCode}`;
            res.redirect("/signin");
        }
        else
        {
            //user didn't have a code, no reason for them to be here
            res.redirect("/");
        }
    }
    else
    {
        //check the provided code against the one stored for the currently logged in user
        let result = await verifyEmail.checkCode(req.session.user, req.params.emailCode);
        if (result.success)
        {
            //set email as verified
            let veResult = await verifyEmail.setUserVerified(req.session.user);
            if (veResult.success)
            {
                req.session.emailVerified = true;

                //set user account as activated if not already
                const activatedResult = await database.user.setActivated(req.session.user);
                if (!activatedResult.success)
                {
                    result.clientErrMsg = activatedResult.clientErrMsg;
                    return result;
                }

                req.session.accountActivated = true;

                const prevPage = req.session.prevPage;
                delete req.session.prevPage;
                res.redirect(prevPage || "/");
            }
            else
            {
                res.status(400).send(veResult.clientErrMsg);
            }
        }
        else
        {
            //tell user code is invalid
            res.status(400).send(result.clientErrMsg);
        }
    }
});

module.exports = router;