const mongoose = require("mongoose");
const {ObjectId} = require("mongoose");

//model for email verification tokens
const EmailTokenSchema = new mongoose.Schema({
    value: {
        type: String,
        required: true,
    },
    user: {
        type: ObjectId,
        required: true,
    },
    createdAt: {
        type: Date,
        expires: '7776000',
        default: Date.now
    }
})

const EmailToken = mongoose.model("EmailToken", EmailTokenSchema);

module.exports = EmailToken;