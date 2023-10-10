const mongoose = require("mongoose");
const {ObjectId} = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    gateWay:{
        type: String,
        required: true,
    },
    pidx:{
        type: String,
        required: true,
    },
    amount:{
        type: Number,
        required: true,
    },
    order_id:{
        type: String,
        required: true,
    },
    programName:{
        type: String,
        required: true,
    },
    programId:{
        type: String,
        required: true,
    },
    mobile:{
        type: String,
        required: false,
    },
    transaction_id:{
        type: String,
        required: false,
    },
    status:{
        type: String,
        default: null,
    },
    used: {
        type: Boolean,
        default: false,
    },
    user: {
        type: ObjectId,
        required: true,
    },
})

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;