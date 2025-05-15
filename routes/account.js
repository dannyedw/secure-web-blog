
const router = require('express').Router();
const path = require("path");

const { database } = require("../database/database");
const { regenerateSession } = require("../helpers/regenerateSession");
const { verifyEmail } = require("../helpers/emailVerification");
const { mfa } = require("../helpers/mfa");


router.get("/", (req, res) => {
    if (req.session.user)
    {
        if (req.session.emailVerified)
        {
            //signed in, allow access to account page
            res.sendFile(path.join(__dirname, "../public/html/account.html"));
        }
        else
        {
            req.session.prevPage = "/account";
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
        //not signed in, redirect to sign in page
        req.session.prevPage = "/account";
        res.redirect("/signin");
    }
});

router.post("/", async (req, res) => {
    //post route used for getting and updating user info

    const username = req.session.user;
    if (username == null)
    {
        //can't view/update an account if not signed in to one
        res.status(400).json("user must be signed in to perform this action");
        return;
    }

    //check request type for get or update user details, pass req and res to relevant function
    switch (req.body.type)
    {
        case "get":
            //response handled by these functions, no need to await or take further action
            getUserInfo(req, res, username);
            break;

        case "update":
            if(req.body.hidden_csrf_token !== req.session.csrfToken)
            {
                res.status(400).json("Request Denied");
                return;
            }
            updateUserInfo(req, res, username);
            break;

        case "delete":
            if(req.body.hidden_csrf_token !== req.session.csrfToken)
            {
                res.status(400).json("Request Denied");
                return;
            }

            deleteUser(req, res, username);
            break;

        case "enablemfa":
            enableMFA(req, res, username);
            break;

        default:
            res.status(400).json("invalid or missing request type");
            break;
    }
});

async function getUserInfo(req, res, username)
{
    //query database for user's details
    let result = await database.user.getDetails(username);

    if (result.success)
    {
        res.status(200).json(result.details);
    }
    else
    {
        res.status(400).json(result.clientErrMsg);
    }
}

async function updateUserInfo(req, res, username)
{
    //check if required items (field, value) are present
    const field = req.body.field;
    if (field == null)
    {
        res.status(400).json("no field supplied");
        return;
    }

    const value = req.body.value;
    if (value == null)
    {
        res.status(400).json("no value supplied");
        return;
    }

    //password may be empty, since its not required for all update fields. fields which require it check it in update()
    let plainPassword = req.body.password;

    const result = await database.user.update(username, field, value, plainPassword);
    plainPassword = undefined;
    req.body.password = undefined;

    if (!result.success)
    {
        //inform client of error
        res.status(400).json(result.clientErrMsg);
        return;
    }

    //check if a new username was set, if so the session variable needs updating
    if (result.newSessionUser != null)
    {
        req.session.user = result.newSessionUser;
    }

    //check if new email was set, if so needs verifying again
    if (field == "email" && result.newEmail)
    {
        req.session.emailVerified = false; //this will cause user to redirect to check email page when /account is refreshed
        
        const veResult = await verifyEmail.generate(username);
        if (!veResult.success)
        {
            res.status(400).json(veResult.clientErrMsg);
            return;
        }
    }

    if (!(field == "username" || field == "password"))
    {
        //successfully updated value, redirect to refresh account page and show new value
        res.status(200).redirect("/account");
        return;
    }

    //login details have changed, regenerate session with new id, so if old session was hijacked it will no
    //longer be valid and require re-login with new details. of course, this also means an attacker can change
    //password and expire the session of legitimate user...
    const regenSessionResult = await regenerateSession(req, res);
    if (regenSessionResult.success)
    {
        res.status(200).redirect("/account");
    }
    else
    {
        console.error("error in account post: session regenerate: ", err);
        res.status(400).json(regenSessionResult.clientErrMsg);
    }
}

async function deleteUser(req, res, username)
{
    const result = await database.user.delete(username);

    if (result.success)
    {
        req.session.destroy();
        res.clearCookie("signedin");
        res.status(200).json("Successfully deleted account");
    }
    else
    {
        res.status(400).json(result.clientErrMsg);
    }
}

async function enableMFA(req, res, username)
{
    if (req.session.mfaEnabled)
    {
        res.status(400).json("MFA is already enabled");
        return;
    }

    //set mfa code and send email with it
    const generateResult = await mfa.generate(username);
    if (!generateResult.success)
    {
        res.status(400).json(generateResult.clientErrMsg);
        return;
    }

    //redirect user to enter code on enable page (not general sign in page)
    res.status(200).redirect("/checkemail/mfaenable");
}

module.exports = router;