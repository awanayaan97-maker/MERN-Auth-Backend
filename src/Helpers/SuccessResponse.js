
function SuccessResponse(status, statusCode, message, data){

    let response = {
        status,
        statusCode,
        message,
        data
    }

    return response

}

function rejectResponse(status, statusCode, message){

    let response = {
        status,
        statusCode,
        message
    }

    return response

}

module.exports = {SuccessResponse, rejectResponse}