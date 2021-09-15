const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Dheerendra Agrawal <${process.env.EMAIL_FROM}>`
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // SendGrid
            // console.log(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth : {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
        }

        return nodemailer.createTransport({
            // service: 'Gmail', // predefined service
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            } // Activate in gmail "less secure app" option
        });
    }

    async send(template, subject) {
        // Send the actual mail

        // Render HTML based on pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // Define the email option
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            text: htmlToText.fromString(html),
            html
        };

        // create transport and send mail
        await this.newTransport().sendMail(mailOptions);
        
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours Family!');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset toke only valid for 10 mins.');
    }
}

const sendEmail = async options => {

    // Create Transporter/ Service
    // const transporter = nodemailer.createTransport({
    //     // service: 'Gmail', // predefined service
    //     host: process.env.EMAIL_HOST,
    //     port: process.env.EMAIL_PORT,
    //     auth: {
    //         user: process.env.EMAIL_USERNAME,
    //         pass: process.env.EMAIL_PASSWORD
    //     } // Activate in gmail "less secure app" option
    // });

    // Define Email Option

    // const mailOptions = {
    //     from: 'Dheerendra Agrawal <test@dheerendra.io>',
    //     to: options.email,
    //     subject: options.subject,
    //     text: options.message,
    //     // html:
    // };

    //Actually Send Email

    // await transporter.sendMail(mailOptions);

}

// module.exports = sendEmail;