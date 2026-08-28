
const User = require("../Models/UserSchema")
const ApiError = require("../utils/ApiError")
const ApiResponse = require("../utils/ApiRespone")

async function getUser(req, res, next){

const id = req.user.id

try {
    
    const fetchUser = await User.findById(id).select("-password")

    if(!fetchUser) throw new ApiError(500, "Something went wrong")

    res.status(200).json(new ApiResponse(200, "Data send successfully", fetchUser))

} 

catch (error) {
  next(error)
}
}


module.exports = { getUser }