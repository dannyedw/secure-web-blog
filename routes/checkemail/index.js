
//https://stackoverflow.com/questions/25260818/rest-with-express-js-nested-router
const router = require('express').Router();

router.use("/changedemail", require("./changedemail"));
router.use("/forgotpassword", require("./forgotpassword"));
router.use("/mfa", require("./mfa"));
router.use("/mfaenable", require("./mfaenable"));
router.use("/signup", require("./signup"));

module.exports = router;