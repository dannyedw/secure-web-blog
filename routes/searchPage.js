
const router = require('express').Router();
const path = require('path');

const { database } = require("../database/database");


router.get("/", (req, res) => {
    if (req.session.user && !req.session.emailVerified)
    {
        //logged in and not verified
        req.session.prevPage = "/searchPage";
        if (req.session.accountActivated)
        {
            res.redirect("/checkemail/changedemail");
        }
        else
        {
            res.redirect("/checkemail/signup");
        }
    }
    else
    {
        res.sendFile(path.join(__dirname, "../public/html/searchPage.html"));
    }
});

router.post("/", async (req, res) => {
    //post route used for getting and updating user info

    const username = req.session.user;
    
    result = await database.post.search(username, req.body.searchQuery)

    if (result.success)
    {
        res.status(200).json(result);
    }
    else
    {
        res.status(400).json(result.clientErrMsg)
    }
});

module.exports = router;