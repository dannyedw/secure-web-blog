
const fSignup = document.getElementById("fSignin");
fSignup.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get elements from webpage
    const username = document.getElementById("username").value;
    const plainPassword = document.getElementById("password").value;

    // Check details entered and replace any unwantted characters
    var details = checkDetails( [username] );
    //console.log(details)
    var checked_username = details[0];


    // Send data to NodeJS server - GETTING TypeError: Failed to fetch eventhough data sends
    const result = await makeRequest("/signin", {
        username: checked_username,
        password: plainPassword
    });

    if (result.success)
    {
        //signed up successfully, now logged in. redirect to home page
        window.location.href = result.url;
    }
    else
    {
        //there was an error, inform user        
        //replace this alert with something nicer
        alert(result.details);
    }
});

function toggleShowPassword() {
    var showPButton = document.getElementById("password");

    if (showPButton.type === "password") 
    {
        showPButton.type = "text";
    } 
    else
    {
        showPButton.type = "password";
    }
  }