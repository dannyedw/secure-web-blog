
const btnCancelSignup = document.getElementById("btnCancelSignup");
btnCancelSignup.addEventListener("click", async () => {
    let hidden_csrf_token = document.getElementById("csrf_token").value;
    const result = await makeRequest("/account", {
        type: "delete",
        hidden_csrf_token
    });

    alert(result.details);

    if (result.success)
    {
        window.location.href = "/";
    }
});