const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const crypto = require("crypto");
const User = require("../Models/UserSchema")
const { SuccessResponse, rejectResponse } = require("../Helpers/SuccessResponse");
const PendingSignup = require("../Models/OtpVerificationSchema");
const sendOTP = require("./emailController");
const PasswordReset = require("../Models/passwordResetSchema");


async function signup(req, res) {

  const { firstName, lastName, email, password } = req.body;

  if (firstName === "" || lastName === "" || email === "" || password === "") {
    res.json(rejectResponse(false, 400, "All fields are required"))
  }

  try {

    let userExits = await User.findOne({ email })

    if (userExits) return res.json(rejectResponse(false, 409, "Email or username already exists"))

    let hashPassword = await bcrypt.hash(password, 12)

    const otp = crypto.randomInt(100000, 1000000);

    await PendingSignup.deleteOne({ email })

    const otpData = await PendingSignup.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      otp,
    })

    await sendOTP(email, otp)

    res.json(SuccessResponse(true, 200, "Otp send successfully", otpData))

  }

  catch (error) {

    if (error.message === "ValidationError") {
      res.json(rejectResponse(false, 400, "Validation Error"))
    }

    else if (error.code === 11000) {
      res.json(rejectResponse(false, 409, "email or username already exists"))
    }

    else {
      res.json(rejectResponse(false, 500, "Internel Server Error"))
    }

  }
}

async function login(req, res) {

  let { email, password } = req.body

  try {

    let data = await User.findOne({ email: email });

    if (!data) {
      res.json(rejectResponse(false, 404, "incorrect email user not found"));
      return
    }

    const matchPassword = await bcrypt.compare(password, data.password)

    if (!matchPassword) {
      res.json(rejectResponse(false, 404, "Invalid credentails"))
      return
    }

    let tokenDetails = {
      fisrtName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      id: data._id
    }

    let token = jwt.sign(tokenDetails, process.env.JWT_SECRET)

    res.json(
      {
        status: true,
        statusCode: 200,
        message: "User fetched successfully",
        data: data,
        token: token
      }

    )
  }

  catch (error) {
    res.json(rejectResponse(false, 500, "Internel Server error"))
  }

}

async function OTPVerification(req, res) {

  let { otp, email } = req.body;

  if (!otp || !email) return res.json(rejectResponse(false, 400, "OTP number is required"))

  try {

    let verifyEmail = await PendingSignup.findOne({ email: email })

    if (!verifyEmail) return res.json(rejectResponse(false, 404, "OTP has expired. Please signup again."));

    if (verifyEmail.attempts >= 8) {
      await PendingSignup.deleteOne({ email })
      return res.json(rejectResponse(false, 429, "Too many attempts. Please signup again."));
    }

    if (otp !== verifyEmail.otp) return res.json(rejectResponse(false, 400, "Incorrect OTP. Please try again."));


    let data = await User.create({
      firstName: verifyEmail.firstName,
      lastName: verifyEmail.lastName,
      email: verifyEmail.email,
      password: verifyEmail.password
    })

    if (data) {
      await PendingSignup.deleteOne({ email: verifyEmail.email });
      return res.json(SuccessResponse(true, 201, "User Created Successfully", data))
    }

    else {
      return res.json(rejectResponse(false, 500, "Internel Server Error"))
    }
  }

  catch (error) {
    res.json(rejectResponse(false, 500, "Internel Server Error"))
  }

}

async function resendOTP(req, res) {

  let { email } = req.body

  if (!email) return res.json(rejectResponse(false, 400, "Email is required"))

  try {

    let checkEmail = await PendingSignup.findOne({ email: email });

    if (!checkEmail) return res.json(rejectResponse(false, 400, "No pending signup found. Please signup again."))

    const newOTP = crypto.randomInt(100000, 1000000);

    let updateOTP = await PendingSignup.findOneAndUpdate(
      { email: email, },
      { otp: newOTP, createdAt: new Date() },
      { new: true }
    )

    await sendOTP(email, newOTP)

    res.json(SuccessResponse(true, 200, "New OTP sent to your email"))

  }

  catch (error) {
    return res.json(rejectResponse(false, 500, "Internal Server Error"));
  }

}

async function forgotPasswordOTP(req, res) {

  let { email } = req.body;

  try {

    if (!email) return res.json(rejectResponse(false, 400, "Email is required"))

    let checkUser = await User.findOne({ email })

    if (!checkUser) return res.json(rejectResponse(false, 404, "User not found"))

    let forgetPasswordOTP = crypto.randomInt(100000, 1000000);

    await PasswordReset.deleteOne({ email })
    await PasswordReset.create({ email, OTP: forgetPasswordOTP })

    await sendOTP(email, forgetPasswordOTP)

    res.json(SuccessResponse(true, 200, "OTP sent to your email", forgetPasswordOTP))

  }

  catch (error) {
    res.json(rejectResponse(false, 500, "Internel Server Error"))
  }

}

async function forgotPasswordOTPVerification(req, res) {

  let { otp, email } = req.body

  if (!otp || !email) return res.json(rejectResponse(false, 400, "OTP is required"))

  try {

    let checkUser = await PasswordReset.findOne({ email });

    if (!checkUser) return res.json(rejectResponse(false, 404, "OTP has expired. Please try again. "))

    if (checkUser.OTP !== otp) return res.json(rejectResponse(false, 400, "Incorrect OTP. Please try again."))

    let verifiedUser = await PasswordReset.findOneAndUpdate({ email }, { verified: true }, { new: true })
    res.json(SuccessResponse(true, 200, "OTP Verified", verifiedUser))

  }

  catch (error) {
    res.json(rejectResponse(false, 500, "Internel Server error"))
  }

}

async function resetPassword(req, res) {

  let { password, email } = req.body;

  try {

    let checkUser = await PasswordReset.findOne({ email });

    if (!checkUser || !checkUser.verified) {
      return res.json(rejectResponse(false, 400, "Please verify OTP first"));
    }

    let hashedPassword = await bcrypt.hash(password, 12);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    await PasswordReset.deleteOne({ email });

    return res.json(SuccessResponse(true, 200, "Password reset successful"));

  }


  catch (error) {
     res.json(rejectResponse(false, 500, "Internel server error"))
  }

}

module.exports = { signup, login, OTPVerification, resendOTP, forgotPasswordOTP, forgotPasswordOTPVerification, resetPassword }