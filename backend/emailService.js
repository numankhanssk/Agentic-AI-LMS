
const nodemailer = require("nodemailer");
const path = require("path");

// Configure Gmail transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send OTP email to student
const sendOtpEmail = async (email, studentName, otp) => {
    const logoPath = path.join(
        __dirname,
        "../frontend/src/assets/HomeIcon2.jpeg"
    );

    const mailOptions = {
        from: `"Agentic AI Smart Library" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Student Library Login - OTP Verification",

        attachments: [
            {
                filename: "HomeIcon2.jpeg",
                path: logoPath,
                cid: "libraryLogo"
            }
        ],

        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; text-align: center; border: 1px solid #ddd; border-radius: 10px;">

                <img src="cid:libraryLogo" alt="Smart Library Logo"
                     style="width: 100px; height: auto; margin-bottom: 20px;">

                <h2>Agentic AI Smart Library</h2>

                <p style="text-align: left;">Hello ${studentName},</p>

                <p>Your One-Time Password (OTP) for Student Library Login is:</p>

                <h1 style="color: #1565c0; letter-spacing: 8px;">
                    ${otp}
                </h1>

                <p><strong>Valid for 5 minutes</strong></p>

                <p>Please do not share this OTP with anyone.</p>

                <br>

                <p style="text-align: left;">
                    Regards,<br>
                    <strong>Agentic AI Smart Library</strong>
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
