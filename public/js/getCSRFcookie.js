// get csrf cookie and place into hidden field

// gets the string of all cookies
let cookiesString = document.cookie;
if (cookiesString.length > 0)
{
    // splits the cookies into a json format
    let cookiesArray = document.cookie.split("; ");
    let cookiesJSON = {};
    for (let c of cookiesArray)
    {
        let parts = c.split("=");
        cookiesJSON[parts[0]] = parts[1];
    }

    // console.log(cookiesJSON['csrf_token']);

    // finds the csrf token cookie
    let csrf_token = cookiesJSON['csrf_token'];

    if(csrf_token != undefined)
    {
        // populates the hidden field
        document.getElementById('csrf_token').value = csrf_token;
    }
}