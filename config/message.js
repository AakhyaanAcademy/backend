const Message = (message="Unknown error Occurred.", success=false, data=null) => {
    if(data) return {success: success, message: message, data: data};
    return {success: success, message: message};
}

module.exports = Message;