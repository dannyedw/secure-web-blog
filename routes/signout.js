
const router = require('express').Router();


router.get("/", (req, res) => {
    //doesn't matter if this route is accessed while not signed in
    req.session.destroy();
    res.clearCookie("signedin");
    res.redirect("/");
});

module.exports = router;