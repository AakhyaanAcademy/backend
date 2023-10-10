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
    mailOptions = {
        ...mailOptions,
        from: {
            address: process.env.MAIL_USER,
            name: 'Aakhyaan Academy'
        }
    };
    return transporter.sendMail(mailOptions)
}

