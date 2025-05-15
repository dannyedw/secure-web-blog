
// Put details in fields automatically on page load 
window.onload =  async () => {
    let result = await makeRequest("/account", {
        type: "get"
    });

    var jsonData = JSON.parse(JSON.stringify(result.details));
    // Get elements from webpage
    let FN = document.getElementById('firstName');
    let LN = document.getElementById('lastName');
    let UN = document.getElementById('username');
    let EM = document.getElementById('email');
    
    // Put data into fields
    FN.value = jsonData.first_name;
    LN.value = jsonData.last_name;
    UN.value = jsonData.username;
    EM.value = jsonData.email;

    if (MFA_ENABLED) //see checkSignedIn.js
    {
        document.getElementById("btnEnableMFA").style.display = "none";
    }

}

// Update Function for Each button/field

async function updateFN()
{
    let hidden_csrf_token = document.getElementById("csrf_token").value;
    let result = await makeRequest("/account", {
            type: "update",
            field: "first_name", //valid fields: username, password, first_name, last_name, email
            value: document.getElementById('firstName').value,
            hidden_csrf_token,
            //password: "AlexF123" //username and password require the current password also be supplied
    });
    
    if (result.success)
    {
        window.location.href = result.url;
        console.log("SUCC");
    }
    else
    {
        alert(result.details);
        console.log("ELSE");
    }
    
}

async function updateLN()
{
    let hidden_csrf_token = document.getElementById("csrf_token").value;
    let result = await makeRequest("/account", {
            type: "update",
            field: "last_name", //valid fields: username, password, first_name, last_name, email
            value: document.getElementById('lastName').value,
            hidden_csrf_token
            //password: "AlexF123" //username and password require the current password also be supplied
    });

    if (result.success)
    {
        window.location.href = result.url;
        console.log("SUCC");
    }
    else
    {
        alert(result.details);
        console.log("ELSE");
    }
    
    
}

function requestPWUN()
{
    var x = document.getElementById("unChange");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
    } 
    else 
    {
        x.style.display = "none";
    }
}

function requestPWEM()
{
    var x = document.getElementById("emChange");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
    } 
    else 
    {
        x.style.display = "none";
    }
}


async function updateUN()
{


    var pw = document.getElementById("unPW").value;
    let hidden_csrf_token = document.getElementById("csrf_token").value;

    let result = await makeRequest("/account", {
            type: "update",
            field: "username", //valid fields: username, password, first_name, last_name, email
            value: document.getElementById('username').value,
            hidden_csrf_token,
            password: pw //username and password require the current password also be supplied
    });

    if (result.success)
    {
        window.location.href = result.url;
        console.log("SUCC");
    }
    else
    {
        alert(result.details);
        console.log("ELSE");
    }
    
    
}

async function updateEM()
{
    let hidden_csrf_token = document.getElementById("csrf_token").value;

    var pw = document.getElementById("emPW").value;

    let result = await makeRequest("/account", {
            type: "update",
            field: "email", //valid fields: username, password, first_name, last_name, email
            // Get value in FN field
            value: document.getElementById('email').value,
            hidden_csrf_token,
            password: pw //username and password require the current password also be supplied
    });

    if (result.success)
    {
        window.location.href = result.url;
        console.log("SUCC");
    }
    else
    {
        alert(result.details);
        console.log("ELSE");
    }  
    
}

// change password button displays relevant fields
function changePW()
{
    var x = document.getElementById("pwChange");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
    } 
    else 
    {
        x.style.display = "none";
    }
}

async function updatePW()
{
    let OPW = document.getElementById('oldPW').value;
    let NPW = document.getElementById('newPW').value;
    let NRPW = document.getElementById('newPWRep').value;

    if ( NPW != NRPW)
    {
        alert("Passwords do not match");
        
        return;
    }
    else if (OPW.length > 32 || NPW.length > 32 || NRPW.length > 32 )
    {
        alert("Password is to Long");
        
        return;
    }
    else if (OPW.length < 4  || NPW.length < 4 || NRPW.length < 4)
    {
        alert("Password is to Short");
        
        return;
    }

    let hidden_csrf_token = document.getElementById("csrf_token").value;

    let result = await makeRequest("/account", {
            type: "update",
            field: "password", //valid fields: username, password, first_name, last_name, email
            // Get value in FN field
            value: NPW,
            hidden_csrf_token,
            password: OPW //username and password require the current password also be supplied
    });

    if (result.success)
    {
        window.location.href = result.url;
        console.log("SUCC");
    }
    else
    {
        alert(result.details);
        console.log("ELSE");
    }  
    
}

async function enableMFA()
{
    let result = await makeRequest("/account", {
        type: "enablemfa"
    });

    if (result.success)
    {
        window.location.href = result.url;
    }
    else
    {
        alert(result.details);
    }
}