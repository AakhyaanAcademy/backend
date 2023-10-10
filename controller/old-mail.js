const nodemailer = require("nodemailer");

const options = {
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
}

let transporter = nodemailer.createTransport(options)

exports.sendMail = async (mailOptions) => {
    mailOptions = {...mailOptions, from: process.env.MAIL_USER};
    
    const { validationResult } = require("../middleware/validators/user");
    transporter.verify( (err, sucess) => {
        if(err) return err;
        console.log("Connected to Mail server.");
    });

    return transporter.sendMail(mailOptions, (err, success) => {
        if(err) return err;
        return success;
    })
}

