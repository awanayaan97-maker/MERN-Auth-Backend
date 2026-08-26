const express = require("express");
const {signup, login, OTPVerification, resendOTP, forgotPasswordOTP, forgotPasswordOTPVerification, resetPassword} = require("../Controllers/authController");

const router = express.Router();

router.post("/signup", signup)
router.post("/login", login)
router.post("/verification", OTPVerification)
router.post("/resendOTP", resendOTP)
router.post("/forget-password-otp", forgotPasswordOTP)
router.post("/verify-forgot-password-otp", forgotPasswordOTPVerification)
router.post("/resetPassword", resetPassword)
module.exports = router