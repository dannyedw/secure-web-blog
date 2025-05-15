// Gets the post id from the url then gets the title and content
async function getPost()
{
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const postId = urlParams.get('postId');
    // console.log("Post id: ", postId);

    const result = await makeRequest("/editpost", {type: 'get', postId: postId});

    if(result.success === true)
    {
        // console.log(result.details);
        result.details.title = result.details.title.replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#x27;/gi,"'")
        result.details.content = result.details.content.replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#x27;/gi,"'")

        document.getElementById("ptitle").value = result.details.title;
        document.getElementById("content").value = result.details.content;
        document.getElementById('visibility').value = result.details.visibility;
        document.getElementById("postId").value = postId;

        if(result.details.img_name != undefined)
        {
            document.getElementById('imgFilename').innerText = result.details.img_name;
            document.getElementById('imgPresent').style.display = 'block';
            document.getElementById('noImg').style.display = 'none';
        }
    }
    else
    {
        console.log(result.clientErrMsg)
        window.location.replace("/"); //replace with 404
    }
}

// Warns the user then deletes the post
async function deletePost(e)
{
    let postId = document.getElementById('postId').value
    var hidden_csrf_token = document.getElementById("csrf_token").value;

    if(confirm("Are you sure you want to delete this post?"))
    {
        const result = await makeRequest("/editpost", {
            type: 'delete',
            postId,
            hidden_csrf_token
        });
    
        if(result.success)
        {
            alert("Post Successfully Deleted");
            window.location.href = result.url;
        }
        else
        {
            alert(result.details);
            window.location.replace("/");
        } 
    }
    else
    {
        return;
    }
}

async function deleteImg()
{
    let postId = document.getElementById('postId').value
    var hidden_csrf_token = document.getElementById("csrf_token").value;

    if(confirm("Are you sure you want to delete this image?"))
    {
        const result = await makeRequest("/editpost", {
            type: 'deleteImg',
            postId,
            hidden_csrf_token
        });
    
        if(result.success)
        {
            // alert("Image Deleted");
            document.getElementById('imgFilename').innerText = '';
            document.getElementById('imgPresent').style.display = 'none';
            document.getElementById('noImg').style.display = 'block';
            document.getElementById("errorMessage").textContent = '';
        }
        else
        {
            document.getElementById("errorMessage").textContent = result.details;
        } 
    }
}

async function uploadNewImg()
{
        // Get elements from webpage
        let postId = document.getElementById('postId').value
        var hidden_csrf_token = document.getElementById("csrf_token").value;
        var imageInput = document.getElementById("image");
    
        var image;
        if(imageInput.files.length === 1)
        {
            image = imageInput.files[0];
        }
        else
        {
            document.getElementById('errorMessage').textContent = "Select File";
        }
        
        // console.log(postId);
        // console.log(hidden_csrf_token);
        // console.log(imageInput);
    
        let formData = new FormData();
        formData.append("reqType", 'imgUpload')
        formData.append("postId", postId)
        formData.append("hidden_csrf_token", hidden_csrf_token)
        formData.append("image", image)
    
        const result = await fetch("/createPost", {
            method: 'POST',
            body: formData,
        });
    
        if (result.status === 200)
        {
            alert("Image has been uploaded");
            let newFileName = await result.json();
            document.getElementById('imgFilename').innerText = newFileName;
            document.getElementById('imgPresent').style.display = 'block';
            document.getElementById('noImg').style.display = 'none';
            document.getElementById("image").value = ''
            document.getElementById("errorMessage").textContent = '';
        }
        else
        {
            //there was an error, inform user      
            let err_message = await result.json(); 
            document.getElementById('errorMessage').textContent = err_message;
        }
}

// If the title box was modified a hidden field will be set to true
// If the box hasnt been changed then the server wont update it
function titleModified()
{
    document.getElementById('titleWasEdited').value = true;
    document.getElementById('ptitle').removeEventListener('change', titleModified);
}
document.getElementById('ptitle').addEventListener('change', titleModified);

// If the content box was modified a hidden field will be set to true
// If the box hasnt been changed then the server wont update it
function contentModified()
{
    document.getElementById('contentWasEdited').value = true;
    document.getElementById('content').removeEventListener('change', contentModified);
}
document.getElementById('content').addEventListener('change', contentModified);

function visibilityModified()
{
    document.getElementById('visibilityWasEdited').value = true;
    document.getElementById('visibility').removeEventListener('change', visibilityModified);
}
document.getElementById('visibility').addEventListener('change', visibilityModified);

// If the update post button is clicked
const editPostForm = document.getElementById('editPost');
editPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    let newTitle; 
    let newContent;
    let newVisibility;

    let titleChanged = document.getElementById('titleWasEdited').value;
    let contentChanged = document.getElementById('contentWasEdited').value;
    let visibilityChanged = document.getElementById('visibilityWasEdited').value;
    let hidden_csrf_token = document.getElementById("csrf_token").value;


    let details;

    if(titleChanged === 'false' && contentChanged === 'false' && visibilityChanged === 'false')
    {
        alert("No changes to update");
        return;
    }
    
    if(titleChanged === 'true')
    {
        newTitle = document.getElementById('ptitle').value;

        if(newTitle.length > 50)
        {
            document.getElementById("errorMessage").textContent = "Title must be shorter";
            return;
        }

        details = checkDetails( [newTitle] );
        newTitle = details[0];
    }

    if(contentChanged === 'true')
    {
        newContent = document.getElementById('content').value;

        if(newContent.length > 256)
        {
            document.getElementById("errorMessage").textContent = "Content must be shorter";
            return;
        }

        details = checkDetails( [newContent] );
        newContent = details[0];
    }
    
    if(visibilityChanged === 'true')
    {
        newVisibility = document.getElementById('visibility').value;
    }

    let postId = document.getElementById('postId').value;
    details = checkDetails( [postId] );
    postId  = details[0];


    const result = await makeRequest("/editpost", {
        type: 'update',
        postId,
        newTitle,
        newContent,
        newVisibility,
        hidden_csrf_token
    });

    if(result.success)
    {
        alert("Post Successfully Updated");
        window.location.href = result.url;
    }
    else
    {
        alert(result.details);
        window.location.replace("/");
    }
})

getPost()
document.getElementById('deletePost').addEventListener('click', deletePost);
document.getElementById('deleteImage').addEventListener('click', deleteImg);
document.getElementById('uploadNewImg').addEventListener('click', uploadNewImg);