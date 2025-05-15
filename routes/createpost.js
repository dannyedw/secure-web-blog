
const router = require('express').Router();
const path = require("path");
// const imageUploader = require('../database/imageUploader')

//////////////////////////////
const multer = require("multer");
// ADD MIMI sniffer 
//https://stackoverflow.com/questions/35050071/cant-get-multer-filefilter-error-handling-to-work
//https://mimesniff.spec.whatwg.org/#matching-an-image-type-pattern
var storage = multer.diskStorage(
    {
        destination: './public/imgUploads/',
        filename: function ( req, file, cb ) {
            // Below gets rid of any non alphanumeric characters to stop any directory traversal attacks 
            let sanitisedFileName = file.originalname.replace(/[&\/\\#,+()$~%'":*? <>{}]/g,'_');
            // Adds time to file name so that there are no file name duplications
            cb(null, Date.now() + '-' + sanitisedFileName);
        }
    }
);
const upload = multer({ 
    storage: storage,
    limits: {fileSize: 50000000}, //limit files to 500KB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;

        //Checks the extention name is valid
        const extName = fileTypes.test(path.extname(file.originalname).toLocaleLowerCase());
        //checks the mime type is valid
        const mimeType = fileTypes.test(file.mimetype);

        if(mimeType && extName)
        {
            return cb(null, true);
        }
        else
        {
            req.fileValidationError = 'File type Rejected';
            return cb(null, false, new Error('File type Rejected'));
        }
    }
});
////////////////////////////////////////////////////////////
const { database } = require("../database/database");

router.get("/", (req, res) => {
    if (req.session.user)
    {
        if (req.session.emailVerified)
        {
            //signed in, allow access to post page
            res.sendFile(path.join(__dirname, "../public/html/createpost.html"));
        }
        else
        {
            req.session.prevPage = "/createpost";
            if (req.session.accountActivated)
            {
                res.redirect("/checkemail/changedemail");
            }
            else
            {
                res.redirect("/checkemail/signup");
            }
        }
    }
    else
    {
        //not signed in, redirect to sign in page
        req.session.prevPage = "/createpost";
        res.redirect("/signin");
    }
});

router.post("/", upload.single('image'), async (req, res) => {
    //post route used for getting and updating user info

    if(req.fileValidationError)
    {
        console.error(req.fileValidationError)
        res.status(400).json("File type denied");
        return;
    }

    const username = req.session.user;

    let filename = ''
    try
    {
        if(req.file.filename != undefined)
        {
            filename = req.file.filename;
        }
    }
    catch(err){};

    if(req.body.reqType === 'post')
    {
        
        if (username == null)
        {
            //can't view/update an account if not signed in to one
            res.redirect("/signin");
            return;
        }
    
        createPost(req, res, username, filename)
    }
    else if(req.body.reqType === 'imgUpload')
    {
        const postId = req.body.postId;
        
        if(filename == '')
        {
            res.status(400).json("No file Present");
            return;
        }
        else
        {
            updateImg(req, res, username, filename, postId);
        }
    }
    else
    {
        res.status(400).json("Invalid req");
        return;
    }
});
module.exports = router;

async function createPost(req, res, username, filename)
{
    const postTile = req.body.title;
    const postContent = req.body.content;
    const postVisibility = req.body.visibility;
    const csrfToken = req.body.hidden_csrf_token;

    if(csrfToken !== req.session.csrfToken)
    {
        res.status(400).json("Request Denied");
        return;
    }

    let result = await database.post.create(username, postTile, postContent, postVisibility, filename)

    if (result.success)
    {
        res.status(200).redirect('/')
    }
    else
    {
        res.status(400).json(result.clientErrMsg)
    }
}

async function updateImg(req, res, username, filename, postId)
{
    const csrfToken = req.body.hidden_csrf_token;

    if(csrfToken !== req.session.csrfToken)
    {
        res.status(400).json("Request Denied");
        return;
    }

    let result = await database.post.updateImg(username, postId, filename)

    if (result.success)
    {
        res.status(200).json(filename);
    }
    else
    {
        res.status(400).json(result.clientErrMsg)
    }
}