
const nodemailer = require("nodemailer");


//https://www.freecodecamp.org/news/use-nodemailer-to-send-emails-from-your-node-js-server/
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.MAIL_USERNAME,
        clientId: process.env.MAIL_OAUTH_CLIENTID,
        clientSecret: process.env.MAIL_OAUTH_CLIENT_SECRET,
        refreshToken: process.env.MAIL_OAUTH_REFRESH_TOKEN
    }
});

let emailSender = {};
exports.emailSender = emailSender;

emailSender.sendSignupLink = (recipient, link) => {
    const subject = "DSSUG10 baking blog - finish setting up your account";
    const text =
`Please click the link below to verify your email and finish activating your account
${link}`;

    sendMail(recipient, subject, text);
};

emailSender.sendPWResetLink = (recipient, link) => {
    const subject = "Password reset for DSSUG10 baking blog";
    const text =
`A request was made to reset the password of this account. Click the link below to be taken to a page to enter a new password.
If this was not you, you can safely ignore this email
${link}`;

    sendMail(recipient, subject, text);
};

emailSender.sendMFACode = (recipient, code) =>
{
    const subject = "Authentication code for DSSUG10 baking blog";
    const text = code;
    sendMail(recipient, subject, text);
}


function sendMail(recipient, subject, text)
{
    let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: recipient,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (err, data) => {
        if (err)
        {
            console.error("emailSender: sendMail: failed to send email: ", err);
        }
    });
}