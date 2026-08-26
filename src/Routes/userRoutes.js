
const express = require("express");
const authMiddleware = require("../Middlewares/authMiddleware");
const { getUser } = require("../Controllers/userController")

const router = express.Router();

router.get("/", authMiddleware, getUser)

module.exports = router