
const router = require('express').Router();
const path = require('path');

const { database } = require("../database/database");


router.get("/", (req, res) => {
    if (req.session.user)
    {
        if (req.session.emailVerified)
        {
            //email verified, allow access to home page
            res.sendFile(path.join(__dirname, "../public/html/index.html"));
            res.cookie("signedin", true);
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
        res.cookie("signedin", false);
        res.sendFile(path.join(__dirname, "../public/html/index.html"));
    }
});

router.post("/", async (req, res) => {
    const username = req.session.user;

    // checks that there is a username in the session,#
    // if their is then get all posts with their private posts
    // if not than just get the public posts
    var result;
    if(username != null || username != undefined)
    {
        result = await database.post.getPublicAndPrivatePosts(username);
    }
    else
    {
        result = await database.post.getPublicPosts();
    }

    if(result.success)
    {
        res.status(200).json(result.posts);
    }
    else
    {
        res.status(400).json(result.clientErrMsg);
    }
});

module.exports = router;