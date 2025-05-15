
const { pool } = require("./connectionPool");
const fs = require('fs');

let post = {};
exports.post = post;

const GENERIC_CLIENT_ERRMSG = "something went wrong";

post.getPublicPosts = async () => {
    let result = { success: false, clientErrMsg: "", posts: {}} 

    try
    {
        const query = "SELECT posts.title, posts.content, users.username, posts.creation_date, posts.last_edit_date, posts.img_name FROM posts, users WHERE users.id = posts.user_id AND posts.visibility = 'public' ORDER BY posts.creation_date DESC";
        queryResult = await pool.query(query);
    }
    catch(err)
    {
        console.error("getPublicPosts: error geting public posts: ", err);
        result.clientErrMsg = "error getting posts";
        return result;
    }

    result.success = true;
    result.posts = queryResult.rows;
    return result;
};

post.getPublicAndPrivatePosts = async (username) => {
    let result = { success: false, clientErrMsg: "", posts: {}} 

    try
    {
        // Most secure way to do this
        // Also may not want to return post id???
        const query = "SELECT posts.title, posts.content, users.username, posts.creation_date, posts.visibility, posts.id, posts.last_edit_date, CASE WHEN users.username = $1 THEN 'owner' ELSE 'no' END AS owner, posts.img_name FROM posts, users WHERE users.id = posts.user_id AND (posts.visibility = 'public' OR (posts.visibility = 'private' AND users.username = $1)) ORDER BY posts.creation_date DESC";
        const values = [username]
        queryResult = await pool.query(query, values);
    }
    catch(err)
    {
        console.error("getPublicAndPrivatePosts: error geting public posts: ", err);
        result.clientErrMsg = "error getting posts";
        return result;
    }

    result.success = true;
    result.posts = queryResult.rows;
    return result;
};

post.getPost = async (username, postId) => {
    let result = { success: false, clientErrMsg: "", details: {} };

    try
    {
        const query = "SELECT posts.title, posts.content, posts.visibility, posts.img_name FROM posts, users WHERE posts.user_id = users.id AND posts.id = $1 AND users.username = $2"
        const values = [postId, username]
        queryResult = await pool.query(query, values);
    }
    catch (err)
    {
        console.error("getPost: error getting user post: ", err);
        result.clientErrMsg = "error getting post"
        return result;
    }

    if(queryResult.rows.length === 0)
    {
        result.clientErrMsg = "error getting post"
        return result;
    }

    result.details = queryResult.rows[0];
    result.success = true;

    return result;
};

post.create = async (username, postTitle, postContent, postVisibility, postFilename) => {
    let result = { success: false, clientErrMsg: ""} ;

    try
    {
        const query = "INSERT INTO posts (user_id, title, content, creation_date, visibility, img_name) VALUES ((SELECT id FROM users WHERE username = $1), $2, $3, CURRENT_TIMESTAMP, $4, $5)";
        postTitle = inputSanitationCSS(postTitle);
        postContent = inputSanitationCSS(postContent);

        if(postFilename === '')
        {
            postFilename = null;
        }
        
        const values = [username, postTitle, postContent, postVisibility, postFilename];
        queryResult = await pool.query(query, values);
    }
    catch(err)
    {
        console.error("post.create: error creating post: ", err);
        result.clientErrMsg = "Error adding post";
        return result;
    }

    result.success = true;
    return result;
};

post.update = async (username, field, value, postId) => {
    let result = { success: false, clientErrMsg: ""}; 

    field = field.toLowerCase();
    let updateResult;
    switch(field)
    {
        case "title":
            updateResult = await updatePostTitle(username, postId, value);
            break;

        case "content":
            updateResult = await updatePostContent(username, postId, value);
            break;

        case "visibility":
            updateResult = await updatePostVisibility(username, postId, value);
            break;

        default:
            result.clientErrMsg = "invalid field";
            return result;
    }

    if (!updateResult.success)
    {
        result.clientErrMsg = updateResult.clientErrMsg;
        return result;
    }
    
    //value updated successfully
    result.success = true;
    return result;
};

post.delete = async (username, postId) => {
    let result = { success: false, clientErrMsg: ""}
    let isOwner = await isPostOwner(username, postId);

    if(isOwner === true)
    {
        try
        {
            const queryImg = "SELECT posts.img_name FROM users, posts WHERE posts.id = $1 AND posts.user_id = users.id AND users.username = $2"
            const valuesImg = [postId, username];
            const resultImg = await pool.query(queryImg, valuesImg);

            let postFilename = resultImg.rows[0].img_name;
            // Deleting image file from image store
            if(postFilename != null)
            {
                fs.unlink('./public/imgUploads/' + postFilename, (err) => {
                    if (err) throw err;
                  }); 
            }
            const query = "DELETE FROM posts WHERE id = $1"
            const values = [postId]

            await pool.query(query, values);
        }
        catch (err)
        {
           console.error("post Delete: failed to delete post: ", err)
           result.clientErrMsg = "failed to delete post"
           return result 
        }

        result.success = true;
        return result;
    }
    else
    {
        console.error('dont own post');
        result.clientErrMsg = "User does not own post";
        return result;
    }
};

post.search = async (username, searchQuery) => {
    let result = { success: false, searchQuery: "", posts: {}, clientErrMsg: ""} 
    
    if(searchQuery === null || searchQuery === undefined)
    {
        result.success = true;
        return result;
    }

    searchQuery = inputSanitationCSS(searchQuery);
    result.searchQuery = searchQuery;

    // regex to match single words
    reg = '\\y' + searchQuery + '\\y';

    try
    {
        // if the user is logged in it will also search their private posts
        if(username != null || username != undefined)
        {
            const searchDBQuery = "SELECT posts.title, posts.content, users.username, posts.creation_date, posts.visibility, posts.id, posts.last_edit_date, CASE WHEN users.username = $1 THEN 'owner' ELSE 'no' END AS owner, posts.img_name FROM posts, users WHERE users.id = posts.user_id AND (posts.visibility = 'public' OR (posts.visibility = 'private' AND users.username = $1)) AND (posts.title ~* $2 OR posts.content ~* $2 OR users.username  ~* $2) ORDER BY posts.creation_date DESC";
            const values = [username, reg]
            searchResults = await pool.query(searchDBQuery, values);
        }
        else
        {
            const searchDBQuery = "SELECT posts.title, posts.content, users.username, posts.creation_date, posts.last_edit_date, posts.img_name FROM posts, users WHERE users.id = posts.user_id AND posts.visibility = 'public' AND (posts.title ~* $1 OR posts.content ~* $1 OR users.username  ~* $1) ORDER BY posts.creation_date DESC";
            const values = [reg]
            searchResults = await pool.query(searchDBQuery, values);
        }
    }
    catch(err)
    {
        console.error("posts.search: error geting posts: ", err);
        result.clientErrMsg = "error getting posts";
        return result;
    }

    result.success = true;
    result.posts = searchResults.rows
    return result;
}


post.isOwner = async (username, postId) => {
    let result = { success: false, clientErrMsg: ""} 

    let isOwner = await isPostOwner(username, postId);

    if(isOwner === true)
    {
        result.success = true;
    }
    else
    {
        result.clientErrMsg = "Not post owner"
    }

    return result;
}

post.verifyImageAccess = async(username, imgFilename) => {
    let result = { success: false, clientErrMsg: ""} 

    try
    {
        //Check that the post which contains the image is public or the user owns the post
        const imgAccessQuery = "SELECT * FROM users, posts WHERE posts.user_id = users.id AND posts.img_name = $1 AND (posts.visibility = 'public' OR (posts.visibility = 'private' AND users.username = $2)); ";
        const values = [imgFilename, username]
        searchResults = await pool.query(imgAccessQuery, values);

        if(searchResults.rows.length >= 1)
        {
            result.success = true;
        }
    }
    catch(err)
    {
        console.log(err)
    }

    return result;
}

post.deleteImg = async(username, postId) => {
    let result = { success: false, clientErrMsg: ""}

    try
    {
        let fileNameQuery = "SELECT posts.img_name FROM users, posts WHERE posts.id = $1 AND posts.user_id = users.id AND users.username = $2";
        let values = [postId, username];
        const result = await pool.query(fileNameQuery, values);

        let fileName = result.rows[0].img_name;
        if(fileName != undefined)
        {
            fs.unlink('./public/imgUploads/' + fileName, (err) => {
                if (err) throw err;
              }); 

              let deleteImgNameQuery = "UPDATE posts SET img_name = NULL, last_edit_date = CURRENT_TIMESTAMP FROM users WHERE posts.id = $1 AND posts.user_id = users.id AND users.username = $2";
              let values = [postId, username];
              const result = await pool.query(deleteImgNameQuery, values);
        }
        else
        {
            result.clientErrMsg = "No file found";
            return result;
        }
    }
    catch (err)
    {
        console.error("deleteImg: error deleting img: ", err)
        result.clientErrMsg = "Error Deleting Img"
        return result;
    }

    result.success = true;
    return result;
}

post.updateImg = async(username, postId, imgName) => {
    let result = { success: false, clientErrMsg: ""}

    try
    {
        // If a image is already present in the post database, delete it so it can be replaced with new one
        post.deleteImg(username, postId)
    
        // update post database with new filename
        let updateFileNameQuery = "UPDATE posts SET img_name = $1, last_edit_date = CURRENT_TIMESTAMP FROM users WHERE posts.id = $2 AND posts.user_id = users.id AND users.username = $3";
        values = [imgName, postId, username];
        await pool.query(updateFileNameQuery, values);
    }
    catch(err)
    {
        console.error("updateImg: error updating img: ", err)
        result.clientErrMsg = "Error Updating Img"
        return result; 
    }

    result.success = true;
    return result
}

async function isPostOwner(username, postId)
{
    try
    {
        const query = "SELECT users.username FROM users, posts WHERE posts.id = $1 AND posts.user_id = users.id"
        const values = [postId];
        const result = await pool.query(query, values);

        if(result.rows.length === 0)
        {
            return false;
        }

        if(result.rows[0].username === username)
        {
            return true
        }
        else
        {
            return false;
        }
    }
    catch (err)
    {
        console.error("isPostOwner: error getting owner: ", err)
        return false;
    }
}

async function updatePostTitle(username, postId, newTitle)
{
    result = { success: false, clientErrMsg: ""};

    // update post title
    try
    {
        let isOwner = await isPostOwner(username, postId);

        if(isOwner === true)
        {
            const query = "UPDATE posts SET title = $1, last_edit_date = CURRENT_TIMESTAMP WHERE id = $2";
            newTitle = inputSanitationCSS(newTitle);
            const values = [newTitle, postId];
            await pool.query(query, values);
        }
        else
        {
            result.clientErrMsg = "User does not own post";
            return result;
        }
    }
    catch (err)
    {
        console.error("updatePostTitle: error updating: ", err)
        result.clientErrMsg = "Error Updating Post"
        return result;
    }

    result.success = true;
    return result;
}

async function updatePostContent(username, postId, newContent)
{
    result = { success: false, clientErrMsg: ""};

    // update post content
    try
    {
        let isOwner = await isPostOwner(username, postId);

        if(isOwner === true)
        {
            const query = "UPDATE posts SET content = $1, last_edit_date = CURRENT_TIMESTAMP WHERE id = $2";
            newContent = inputSanitationCSS(newContent);
            const values = [newContent, postId];
            await pool.query(query, values);
        }
        else
        {
            result.clientErrMsg = "User does not own post";
            return result;
        }
    }
    catch (err)
    {
        console.error("updatePostContent: error updating: ", err)
        result.clientErrMsg = "Error Updating Post"
        return result;
    }

    result.success = true;
    return result;
}

async function updatePostVisibility(username, postId, newVisibility)
{
    result = { success: false, clientErrMsg: ""};

    // update post visibility
    try
    {
        let isOwner = await isPostOwner(username, postId);

        if(isOwner === true)
        {
            const query = "UPDATE posts SET visibility = $1, last_edit_date = CURRENT_TIMESTAMP WHERE id = $2";
            const values = [newVisibility, postId];
            await pool.query(query, values);
        }
        else
        {
            result.clientErrMsg = "User does not own post";
            return result;
        }
    }
    catch (err)
    {
        console.error("updatePostContent: error updating: ", err)
        result.clientErrMsg = "Error Updating Post"
        return result;
    }

    result.success = true;
    return result;
}

function inputSanitationCSS(text)
{
    return text.replace(/</gi,'&lt;').replace(/>/gi,'&gt;').replace(/"/gi,'&quot;').replace(/'/gi,'&#x27;')
}