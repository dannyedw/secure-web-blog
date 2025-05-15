
const inpCode = document.getElementById("inpCode");
const btnSubmitCode = document.getElementById("btnSubmitCode");

btnSubmitCode.addEventListener("click", async () => {

    //do some client side validation of code
    const code = inpCode.value;
    if (code.length != 6)
    {
        alert("invalid code");
        return;
    }

    //submit to server
    const result = await makeRequest("/checkemail/mfa", { code: code });
    
    if (!result.success)
    {
        alert(result.details);
        return;
    }

    //code was correct, redirect them as the server requested
    window.location.href = result.url;
});