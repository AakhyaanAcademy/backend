const mongoose = require("mongoose");
const {ObjectId} = require("mongoose");

//model for password reset tokens
const PasswordTokenSchema = new mongoose.Schema({
    value: {
        type: String,
        required: true,
    },
    user: {
        type: ObjectId,
        required: true,
    }
})

PasswordTokenSchema.index({"user": 1}, {expireAfterSeconds: 86400})

const PasswordToken = mongoose.model("PasswordToken", PasswordTokenSchema);

module.exports = PasswordToken;