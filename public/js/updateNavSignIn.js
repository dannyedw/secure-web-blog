
//if the user is signed in, replace Sign In button with Sign Out

window.addEventListener("load", () => {
    if (SIGNED_IN)
    {
        let aSignIn = document.getElementById("aSignIn");
        aSignIn.textContent = "Sign Out";
        aSignIn.href = "/signout";

        let aSignUp = document.getElementById("aSignUp");
        if(aSignUp != null)
        {
            aSignUp.remove();
        }
    }
})