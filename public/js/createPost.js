
const createPostForm = document.getElementById("createPost");
createPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get elements from webpage
    var title = document.getElementById("ptitle").value;
    var content = document.getElementById("content").value;
    var visibility = document.getElementById("visibility").value;
    var imageInput = document.getElementById("image");

    var image;
    if(imageInput.files.length === 1)
    {
        image = imageInput.files[0];
    }

    var hidden_csrf_token = document.getElementById("csrf_token").value;

    if(title.length > 50)
    {
        document.getElementById("errorMessage").textContent = "Title must be shorter";
        return;
    }

    if(content.length > 256)
    {
        document.getElementById("errorMessage").textContent = "Content must be shorter";
        return;
    }
    
    // console.log(title);
    // console.log(content);
    // console.log(visibility);
    // console.log(hidden_csrf_token);

    var details = checkDetails([title,content]);
    title = details[0];
    content = details[1];

    let formData = new FormData();
    formData.append("reqType", 'post')
    formData.append("title", title)
    formData.append("content", content)
    formData.append("visibility", visibility)
    formData.append("hidden_csrf_token", hidden_csrf_token)
    formData.append("image", image)

    const result = await fetch("/createPost", {
        method: 'POST',
        body: formData,
    });


    console.log(result);
    if (result.status === 200)
    {
        //signed up successfully, now logged in. redirect to home page
        window.location.href = result.url;
    }
    else
    {
        //there was an error, inform user      
        let err_message = await result.json(); 
        document.getElementById('errorMessage').textContent = err_message;
    }
});