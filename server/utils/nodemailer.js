const nodemailer = require("nodemailer");

const gmailTransporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
});

const CSS = `
    html {
        height: 100%;
        width: 100%;
    }

    body {
        margin: 0px;
        padding: 20px;
        background-color: #f6f5f7;
    }

    h1 {
        margin: 0px;
        color: #00af23;
    }
`;

//E-MAIL CLIENTS IGNORE EXTERNAL CSS FILE
const generateHTML = (body) => {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>howdy?</title>

                <style type="text/css">
                    ${CSS}
                </style>
            </head>

            <body>
                ${body}
            </body>
        </html>
    `;
};

const send = (res, emailValues) => {
    gmailTransporter.sendMail(
        emailValues,
        (error) => {
            if(error)
                res.json({ message: "EMAIL_SEND_ERROR" });
            else
                res.json({ message: "EMAIL_SEND_OK" });
        }
    );
};

//USING req.body.email
//USING req.body.username
//USING req.body.activationToken
//INSTEAD OF SIGNUP THE USER AFTER THE CLICK IN THE E-MAIL THE SERVER DOES THE OPPOSITE SO IT DOESN'T HAVE TO SPECIFY PERSONAL INFORMATIONS
exports.signupConfirmEmail = (req, res) => {
    if(req.body.email && req.body.username && req.body.activationToken) {
        const emailValues = {
            from: process.env.GMAIL_EMAIL,
            to: req.body.email,
            subject: "howdy? signup confirm",
            html: generateHTML(`
                <h1>howdy? signup confirm</h1>

                <p>
                    Hi <strong>${req.body.username}</strong>,
                    <br>
                    Your registration is almost complete. We invite you to <a href="${process.env.BASE_URL}/api/activeUser/${req.body.activationToken}">click here</a> to confirm your e-mail address.
                </p>
            `)
        };

        send(res, emailValues);
    } else
        res.json({ message: "EMAIL_SEND_ERROR" });
};

exports.changePasswordRequest = (req, res) => {
    if(req.body.email && req.body.username) {
        const emailValues = {
            from: process.env.GMAIL_EMAIL,
            to: req.body.email,
            subject: "howdy? restore password",
            html: generateHTML(`
                <h1>howdy? restore password</h1>

                <p>
                    Hi <strong>${req.body.username}</strong>,
                    <br>
                    We have received a request to restore your password. <a href="${process.env.BASE_URL}/api/managePassword/restorePassword/${req.body.changePasswordToken}">Click here</a> to complete the procedure.
                </p>
            `)
        };

        send(res, emailValues);
    } else
        res.json({ message: "RESTORE_PASSWORD_ERROR" });
};

///////////////////
/// ANDROID APP ///
///////////////////

exports.sendAndroidRandomAuthCode = async (req, res) => {
    // The destination and challenge are server-controlled, not supplied by the client.
    if (!req.user.androidDeviceTokenHash || req.user.auth2FA ||
        (req.user.enrollmentLockedUntil && new Date(req.user.enrollmentLockedUntil).getTime() > Date.now())) {
        return res.status(403).json({ message: "AUTH_2FA_ERROR" });
    }
    const crypto = require("node:crypto");
    const { codeHash } = require("./authTokens");
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    try {
        req.user.androidEnrollmentCodeHash = codeHash(code, process.env.AUTH_SECRET_ENCODING_PASSPHRASE);
        req.user.androidEnrollmentCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await req.user.save();
        const emailValues = {
            from: process.env.GMAIL_EMAIL,
            to: req.user.email,
            subject: "howdy? Android authenticator enrollment",
            html: generateHTML(`
                <h1>howdy? Android authenticator enrollment</h1>
                <p>Hello, your one-time enrollment code is <strong>${code}</strong>.</p>
                <p>It expires in 10 minutes. If you did not request this, ignore this email.</p>
            `)
        };
        send(res, emailValues);
    } catch (_) { res.json({ message: "AUTH_2FA_ERROR" }); }
};
