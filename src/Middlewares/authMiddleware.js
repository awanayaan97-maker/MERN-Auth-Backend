const jwt = require("jsonwebtoken");
const { rejectResponse } = require("../Helpers/SuccessResponse");

function authMiddleware(req, res, next){

    try {
        
    const authHeader = req.headers.authorization;

    if(!authHeader) return res.json(rejectResponse(false, 401, "No token provided"));

    let token = authHeader.split(" ")[1]

    let decodeToken = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decodeToken
    
    next()

    } 
    
    catch (error) {
    return res.json(rejectResponse(false, 401, "Invalid or expired token" ));
    }

}

module.exports = authMiddleware