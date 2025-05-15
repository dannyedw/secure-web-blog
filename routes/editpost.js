
const router = require('express').Router();
const path = require("path");

const { database } = require("../database/database");

router.get("/", async (req, res) => {
    if (req.session.user)
    {
        if (req.session.emailVerified)
        {
            //signed in, allow access to post page
            let postId = req.query.postId;
            let result = await database.post.isOwner(req.session.user, postId)

            if(result.success === true)
            {
                res.sendFile(path.join(__dirname, "../public/html/editpost.html"));
            }
            else
            {
                res.sendFile(path.join(__dirname, "../public/html/404.html"));
            }
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
        //not signed in, redirect to sign in page (no prevpage since not storing the post id to edit)
        res.redirect("/signin");
    }
});

router.post("/", async (req, res) => {
    //post route used for getting and updating user info

    const username = req.session.user;
    const postId = req.body.postId;

    if (username == null)
    {
        //can't view/update an account if not signed in to one
        res.redirect("/signin");
        return;
    }

    //check request type for get or update user details, pass req and res to relevant function
    switch (req.body.type)
    {
        case "get":
            //response handled by these functions, no need to await or take further action

            getUserPost(req,res,username, postId)
            break;

        case "update":
            updateUserPost(req, res, username, postId, req.body.newTitle, req.body.newContent, req.body.newVisibility);
            break;

        case "delete":
            deleteUserPost(req, res, username, postId);
            break

        case "deleteImg":
            deleteImg(req,res,username, postId);
            break;

        default:
            res.status(400).json("invalid or missing request type");
            break;
    }
});

async function getUserPost(req, res, username, postId)
{
    let result = await database.post.getPost(username, postId)

    if (result.success)
    {
        res.status(200).json(result.details);
    }
    else
    {
        res.status(400).json(result.clientErrMsg)
    }
}

async function updateUserPost(req, res, username, postId, newTitle, newContent, newVisibility)
{
    let result;

    const csrfToken = req.body.hidden_csrf_token;

    if(csrfToken !== req.session.csrfToken)
    {
        res.status(400).json("Request Denied");
        return;
    }

    if(newTitle != undefined)
    {
        result = await database.post.update(username, "title", newTitle, postId)
        if(result.success === false)
        {
            res.status(400).json(result.clientErrMsg)
            return;
        }
    }
    
    if(newContent != undefined)
    {
        result = await database.post.update(username, "content", newContent, postId)
        if(result.success === false)
        {
            res.status(400).json(result.clientErrMsg)
            return;
        }
    }

    if(newVisibility != undefined)
    {
        result = await database.post.update(username, "visibility", newVisibility, postId)
        if(result.success === false)
        {
            res.status(400).json(result.clientErrMsg)
            return;
        }
    }

    res.status(200).redirect('/');
}

async function deleteUserPost(req, res, username, postId)
{
    const csrfToken = req.body.hidden_csrf_token;

    if(csrfToken !== req.session.csrfToken)
    {
        res.status(400).json("Request Denied");
        return;
    }

    let result = await database.post.delete(username, postId)

    if (result.success)
    {
        res.status(200).redirect('/');
    }
    else
    {
        res.status(400).json(result.clientErrMsg)
    }
}

async function deleteImg(req,res,username, postId)
{
    const csrfToken = req.body.hidden_csrf_token;

    if(csrfToken !== req.session.csrfToken)
    {
        res.status(400).json("Request Denied");
        return;
    }

    let result = await database.post.deleteImg(username, postId)

    if (result.success)
    {
        res.status(200).redirect('/');
    }
    else
    {
        res.status(400).json(result.clientErrMsg)
    }
}

module.exports = router;