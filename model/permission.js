const mongoose = require("mongoose");
const {ObjectId} = require("mongoose");

//model for storing permissions 
const EmailTokenSchema = new mongoose.Schema({
    value: {
        type: String,
        required: true,
    },
    id: {
        type: ObjectId,
        required: true,
    },
})

const EmailToken = mongoose.model("EmailToken", EmailTokenSchema);

module.exports = EmailToken;