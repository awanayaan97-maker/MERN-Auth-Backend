const transporter = require("../Config/email");

async function sendOTP(email, otp) {

    await transporter.sendMail({
        from: process.env.PORTAL_EMAIL,
        to: email,
        subject: "Signup Verification OTP",
        text: `Your OTP is ${otp}. This OTP will expire in 5 minutes.`
    });
}

module.exports = sendOTP;