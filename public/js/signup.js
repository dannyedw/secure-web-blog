
const fSignup = document.getElementById("fSignup");
fSignup.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get elements from webpage
    const username = document.getElementById("username").value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const plainPassword1 = document.getElementById("password1").value;
    const plainPassword2 = document.getElementById("password2").value;

    if (plainPassword1 != plainPassword2)
    {
        alert("passwords do not match. replace this alert with an error on the form\
            (see https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation#validating_forms_using_javascript");
        
        return;
    }

    if (plainPassword1.length > 256 )
    {
        alert("Password is to Long");
        
        return;
    }
    else if (plainPassword1.length < 8)
    {
        alert("Password is to Short");
        
        return;
    }



    // Check details entered
    var details = checkDetails( [username,firstName,lastName,email] );


    var checked_username = details[0];
    var checked_firstName = details[1];
    var checked_lastName = details[2];
    var checked_email = details[3];


    // Send data to NodeJS server - GETTING TypeError: Failed to fetch eventhough data sends
    const result = await makeRequest("/signup", {
        username: checked_username,
        firstName: checked_firstName,
        lastName: checked_lastName,
        email: checked_email,
        password: plainPassword1
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
    var showPButton = document.getElementById("password1");

    if (showPButton.type === "password") 
    {
        showPButton.type = "text";
    } 
    else
    {
        showPButton.type = "password";
    }
  }