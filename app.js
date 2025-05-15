
//node modules
require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session")
const cookieParser = require("cookie-parser");

//our modules
const { database } = require("./database/database");

//routers
const routers = [
    { name: "/", router: require("./routes/index") },
    { name: "/account", router: require("./routes/account") },
    { name: "/createpost", router: require("./routes/createpost") },
    { name: "/signup", router: require("./routes/signup") },
    { name: "/signin", router: require("./routes/signin") },
    { name: "/signout", router: require("./routes/signout") },
    { name: "/searchPage", router: require("./routes/searchPage") },
    { name: "/editpost", router: require("./routes/editpost") },
    { name: "/verifyemail", router: require("./routes/verifyemail") },
    { name: "/checkemail", router: require("./routes/checkemail") },
];


//test connection to database
database.testConnection();


//create app and tell it to use the routers
const app = express();

//session management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    //cookie should have secure set to true and only send session id over https. but apparenly we're not meant to use https
}));

app.use(cookieParser());

//allow posting json content
app.use(express.json());
app.use(express.urlencoded({extended: false}));


//verify that user should have access to image
app.get('/imgUploads/:filename', async function(req, res, next){
    let hasAccess = await database.post.verifyImageAccess(req.session.user, req.params.filename)

    if(hasAccess.success)
    {
        next();
    }
    else
    {
        res.end('Access Forbidden!');
    }
})

//make public folder accessible
app.use(express.static(path.join(__dirname, "public")));

for (let routeInfo of routers)
{
    app.use(routeInfo.name, routeInfo.router);
}

app.use((req, res) => {
    //anything other than the existing routes will be sent here
    res.status(404).sendFile(path.join(__dirname, "public/html/404.html"));
});

//allowing form data
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

//start the server. stop with ctrl+C in terminal
let port = 8080;
app.listen(port);
console.log("Listening on port:", port);