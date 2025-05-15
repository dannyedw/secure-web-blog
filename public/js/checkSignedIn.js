
//Include this file on any page which wants to be altered if the user is signed in
//This provides no information about which account a user is logged into; that is stored in the session id and should
//only be used on the server side.
//Additionaly functionality can be added in the future for getting user-specific info through their session id
//(e.g. account page)


//THIS SHOULD ONLY BE USED FOR VISUALS LIKE THE SIGN IN/OUT BUTTON AND NOT HAVE ANY VERIFICATION FUNCTIONALITY


let SIGNED_IN = false;
let MFA_ENABLED = false;

//check if a cookie named "signedin" exists and has value of true
let cookieString = document.cookie;
if (cookieString.length > 0)
{
    let cookieArray = document.cookie.split("; ");
    let cookieJSON = {};
    for (let c of cookieArray)
    {
        let parts = c.split("=");
        cookieJSON[parts[0]] = parts[1];
    }

    SIGNED_IN = cookieJSON.signedin == "true";
    MFA_ENABLED = cookieJSON.mfaSecret != undefined;
}