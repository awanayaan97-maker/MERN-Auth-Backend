const { rejectResponse, SuccessResponse } = require("../Helpers/SuccessResponse")
const User = require("../Models/UserSchema")

async function getUser(req, res){

const id = req.user.id

try {
    
    const fetchUser = await User.findById(id).select("-password")

    if(!fetchUser) return res.json(rejectResponse(false, 500, "Something went wrong"))

    res.json(SuccessResponse(true, 200, "Data send successfully", fetchUser))

} 

catch (error) {
    res.json(rejectResponse(false, 500, "Internel server error"))
}

}


module.exports = { getUser }