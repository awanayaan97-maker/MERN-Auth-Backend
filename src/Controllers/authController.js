const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const crypto = require("crypto");
const User = require("../Models/UserSchema")
const PendingSignup = require("../Models/OtpVerificationSchema");
const sendOTP = require("./emailController");
const PasswordReset = require("../Models/passwordResetSchema");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiRespone");


async function signup(req, res, next) {

  const { firstName, lastName, email, password } = req.body ?? {};
  
  if (!firstName || !lastName || !email || !password) return next(new ApiError(400, "All fields are required"))

  try {

    let userExits = await User.findOne({ email })

    if (userExits) throw new ApiError(409, "Email or username already exists")

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

    res.status(200).json(new ApiResponse(200, "Otp send successfully", otpData))
  }

  catch (error) {

    if (error.name === "ValidationError") return next(new ApiError(400, error.message))
      
    else if (error.code === 11000) return next(new ApiError(409, "email or username already exists"))

    else {
      next(error)
    }
   
  }
}

async function login(req, res, next) {

  let { email, password } = req.body ?? {};

  if(!email || !password) return next(new ApiError(400, "email & password is required"))

  try {

    let data = await User.findOne({ email: email });

    if (!data) throw new ApiError(404, "Invalid credentails")

    const matchPassword = await bcrypt.compare(password, data.password)

    if (!matchPassword) throw new ApiError(404, "Invalid credentails")

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
    next(error)
  }

}

async function OTPVerification(req, res, next) {

  let { otp, email } = req.body ?? {};

  if (!otp || !email) return next(new ApiError(400, "OTP number is required"))
    
  try {

    let verifyEmail = await PendingSignup.findOne({ email: email })

    if (!verifyEmail) throw new ApiError(404, "OTP has expired. Please signup again.")

    if (verifyEmail.attempts >= 8) {
      await PendingSignup.deleteOne({ email })
      throw new ApiError(429, "Too many attempts. Please signup again.")
    }

    if (otp !== verifyEmail.otp) throw new ApiError(400, "Too many attempts. Please signup again.")

    let data = await User.create({
      firstName: verifyEmail.firstName,
      lastName: verifyEmail.lastName,
      email: verifyEmail.email,
      password: verifyEmail.password
    })

    if (data) {
      await PendingSignup.deleteOne({ email: verifyEmail.email });
      return res.status(201).json(new ApiResponse(201, "User Created Successfully", data))
    }

    else throw new ApiError(500, "Internel Server Error")
  }

  catch (error) {
    next(error)
  }

}

async function resendOTP(req, res, next) {

  let { email } = req.body ?? {};

  if (!email) return next(new ApiError(400, "Email is required"))

  try {

    let checkEmail = await PendingSignup.findOne({ email: email });

    if (!checkEmail) throw new ApiError(400, "No pending signup found. Please signup again.")

    const newOTP = crypto.randomInt(100000, 1000000);

    let updateOTP = await PendingSignup.findOneAndUpdate(
      { email: email, },
      { otp: newOTP, createdAt: new Date() },
      { new: true }
    )

    await sendOTP(email, newOTP)

    res.status(200).json(new ApiResponse(200, "New OTP sent to your email"))

  }

  catch (error) {
    next
  }

}

async function forgotPasswordOTP(req, res, next) {

  let { email } = req.body ?? {};

   if (!email) return next(new ApiError(400, "Email is required"))

  try {

    let checkUser = await User.findOne({ email })

    if (!checkUser) throw new ApiError(404, "User not found")

    let forgetPasswordOTP = crypto.randomInt(100000, 1000000);

    await PasswordReset.deleteOne({ email })
    await PasswordReset.create({ email, OTP: forgetPasswordOTP })

    await sendOTP(email, forgetPasswordOTP)

    res.status(200).json(new ApiRespone(200, "OTP sent to your email", forgetPasswordOTP))

  }

  catch (error) {
    next(error)
  }

}

async function forgotPasswordOTPVerification(req, res, next) {

  let { otp, email } = req.body ?? {}

  if (!otp || !email) return next(new ApiError(400, "OTP is required"))

  try {

    let checkUser = await PasswordReset.findOne({ email });

    if (!checkUser) throw new ApiError(404, "OTP has expired. Please try again. ")

    if (checkUser.OTP !== otp) throw new ApiError(400, "Incorrect OTP. Please try again.")

    let verifiedUser = await PasswordReset.findOneAndUpdate({ email }, { verified: true }, { new: true })

    res.status(200).json(new ApiResponse(200, "OTP Verified", verifiedUser))

  }

  catch (error) {
    next(error)
  }

}

async function resetPassword(req, res, next) {

  let { password, email } = req.body ?? {} ;

  if(!password || !email) return next(new ApiError(400, "email and reset password is required"))

  try {

    let checkUser = await PasswordReset.findOne({ email });

    if (!checkUser || !checkUser.verified) throw new ApiError(400, "Please verify OTP first")

    let hashedPassword = await bcrypt.hash(password, 12);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    await PasswordReset.deleteOne({ email });

    return res.status(200).json(new ApiResponse(200, "Password reset successful"));

  }


  catch (error) {
    next(error)
  }

}

module.exports = { signup, login, OTPVerification, resendOTP, forgotPasswordOTP, forgotPasswordOTPVerification, resetPassword }