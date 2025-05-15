
const router = require('express').Router();
const path = require("path");


router.get("/", (req, res) => {
    if (!req.session.user || req.session.emailVerified)
    {
        //not signed in, or are signed in and already verified. send them home
        res.redirect("/");
    }
    else
    {
        res.sendFile(path.join(__dirname, "../../public/html/checkemail_changedemail.html"));
    }
});


module.exports = router;