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

    const titleElm = document.createElement('h2');
    
    // REPLACE WITH USERNAME = USERNAME
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

async function getSearchResults(searchQuery)
{
    const result = await makeRequest("/searchPage", {searchQuery: searchQuery});

    if(result.success)
    {
        // update search info
        let noResults
        if(result.details.posts.length === undefined || result.details.posts.length === 0)
        {
            noResults = 0;
        }
        else{
            noResults = result.details.posts.length
        }

        if(noResults === 1)
        {
            document.getElementById('noResults').textContent = noResults + ' result';
        }
        else
        {
            document.getElementById('noResults').textContent = noResults + ' results';
        }
        
        document.getElementById('searchQuery').innerHTML = result.details.searchQuery; //inner html needed for character encoding

        let currentPost;
        let postHTML;

        for (post in result.details.posts)
        {
            currentPost = result.details.posts[post];
            postHTML = createPostHTML(currentPost);
            postContainer.appendChild(postHTML);
        }
    }
    else
    {
        alert(result.details);
    }
}

const postContainer = document.getElementById('postContainer');

// get the search query from the url
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const searchQuery = urlParams.get('query');

document.getElementById('search').value = searchQuery;

getSearchResults(searchQuery);