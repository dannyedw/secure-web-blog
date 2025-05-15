// This function takes the post content and then generates a div with the generated html to display the post
function createPostHTML(currentPost)
{
    let id = currentPost.id;
    let title = currentPost.title;
    let content = currentPost.content;
    let author = currentPost.username;
    let datePosted = currentPost.creation_date;
    let visibility = currentPost.visibility;
    let isOwner = currentPost.owner;
    let lastEditDate = currentPost.last_edit_date;
    let imgName = currentPost.img_name;

    const postContainer = document.createElement('div');
    postContainer.classList.add('card');

    const titleElm = document.createElement('h3');
    
    if(visibility === 'private')
    {
        titleElm.innerHTML = title + " (Private Post)";
    }
    else
    {
        titleElm.innerHTML = title;
    }
    
    let jsDate = new Date(datePosted.replace(' ', 'T'));
    const datePostedElm = document.createElement('h5');
    // Below gets rid of the time zone by spliting on the G in GMT
    datePostedElm.textContent = 'Date Posted: ' + jsDate.toString().split('G')[0];
    
    if(lastEditDate != null)
    {
        let jsDate = new Date(lastEditDate.replace(' ', 'T'));
        // Below gets rid of the time zone by spliting on the G in GMT
        datePostedElm.textContent = datePostedElm.textContent + '--- Last Edited: ' + jsDate.toString().split('G')[0];

    }

    // inner html needed below to render the character codes e.g 
    const postedByElm = document.createElement('h5');
    postedByElm.innerHTML = 'Posted By: ' + author;
    
    const contentElm = document.createElement('p');
    contentElm.innerHTML = content.replace(/\n/gi,'<br>');
    
    postContainer.appendChild(titleElm);
    postContainer.appendChild(datePostedElm);
    postContainer.appendChild(postedByElm);
    postContainer.appendChild(contentElm);
    
    if(imgName != null)
    {
        const imgElm = document.createElement('img');
        imgElm.src = 'imgUploads/' + imgName;
        imgElm.classList.add('postImg')
        postContainer.appendChild(imgElm);
    }

    
    if(isOwner === 'owner')
    {
        const editButton = document.createElement('a');
        editButton.href = "editpost?postId=" + id;
        editButton.innerText = "Edit Post";
        editButton.classList.add('editPostButton')
        postContainer.appendChild(editButton)
    }
    
    return postContainer;
    // returns div containing post html
}

async function getPosts()
{
    const result = await makeRequest("/", {});
        
    if(result.success)
    {
        let currentPost;
        let postHTML;

        for (post in result.details)
        {
            currentPost = result.details[post];
            postHTML = createPostHTML(currentPost);
            postContainer.appendChild(postHTML);
        }
    }
    else
    {
        alert(result.details);
    }
}
// Getting post container add adding the post html
const postContainer = document.getElementById('postContainer');

getPosts();

// TODO: only show certain amount of pages (ether do this on client or server)