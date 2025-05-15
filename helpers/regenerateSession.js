
const { secureRandomCode } = require("../helpers/generateRandomCode");

//wrapping callback with await based on https://medium.com/@khasburrahman/use-async-await-for-your-old-chain-of-callback-functions-9d6eda5bfcf5
function regenerateSession(req, res)
{
    const oldSession = req.session;
    return new Promise((resolve) => {
        req.session.regenerate((err) => {
            let result = { success: false, clientErrMsg: "" };

            if (err)
            {
                result.clientErrMsg = "something went wrong";
                console.error("error regenerating session: ", err);
            }
            else
            {
                //do things that want to happen with all new sessions here

                //copy old session variables over
                for (let key in oldSession)
                {
                    if (key !== "cookie")
                    {
                        req.session[key] = oldSession[key];
                    }
                }


                // Generate random value for csrf token
                let csrfToken = secureRandomCode();
                // save in session to check later
                req.session.csrfToken = csrfToken;
                // send to front end in cookie, a csrf attacker wont be able to access cookies
                res.cookie("csrf_token", csrfToken);


                result.success = true;
            }

            resolve(result);
        });
    });
}

exports.regenerateSession = regenerateSession;