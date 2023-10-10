const axios = require("axios");
const Program = require("../model/program");
const Payment = require("../model/payment");
const ObjectId = require('mongodb').ObjectId;
const Message = require("../config/message");
const User = require("../model/user");

const authorization = {
    'Authorization': "Key bd3932357e7041c599b284c4823ece4f"
}
let baseUrl = "https://a.khalti.com/api/v2";

exports.initiate = async (req, res) => {
    let initiateUrl = baseUrl + '/epayment/initiate/'
    if(!req.user) return res.send(Message("You need to login first."));
    const {programId} = req.params;
    console.log(programId);

    try{
        const currentProgram = await Program.findById(programId);
        if (!currentProgram) return res.status(400).send(Message("No such program"));
        // if(currentProgram.users.includes(ObjectId(req.user._id))) return res.send(Message("You have already joined the program."));

        let purchase_order_id = `${currentProgram._id}_${req.user._id}_${Date.now()}`
        let payload = {
            "return_url": `${process.env.BACKEND_URL}/payment/confirmation`,
            "website_url": `${process.env.BACKEND_URL}`,
            "amount": currentProgram.price,
            purchase_order_id,
            "purchase_order_name": currentProgram.title,
            "customer_info": {
                "name": `${req.user.firstName} ${req.user.lastName}`,
                "email": req.user.email,
                "phone": req.user.phone 
            },
            "amount_breakdown": [{
                "label": "Base Price",
                "amount": currentProgram.price
            }],
            "product_details": [{
                "identity": currentProgram._id,
                "name": currentProgram.title,
                "total_price": currentProgram.price,
                "quantity": 1,
                "unit_price": currentProgram.price 
            }]
        }

        // return res.send(payload);
        const response = await axios.post(
            initiateUrl,
            payload,
            {
                headers: authorization
            }
        );

        console.log(response);
        if(!response.data.payment_url){
            return res.send(Message("Error processing the payment. Please try again later or try contacting us."))
        }
        let payment = new Payment({
            pidx: response.data.pidx,
            gateWay: "Khalti",
            user: req.user._id,
            order_id: purchase_order_id,
            programName: currentProgram.title,
            programId: currentProgram._id,
            amount: currentProgram.price  
        }) 
        await payment.save();
        return res.send(Message("", true, {payment_url: response.data.payment_url}))
        // return res.redirect(response.data.payment_url);
    }catch(err){
        console.log(err);
        console.log(err.response.data);
        return res.send(Message("Error processing the payment. Please try again later or try contacting us."));
    }
}

exports.confirmation = async (req, res) => {
    let {
        pidx,
        amount,
        mobile,
        purchase_order_id,
        transaction_id,
        message
    } = req.query;

    if(message) return res.send(Message(message));

    try{
        let payment = await Payment.findOne({pidx: pidx, gateWay: "Khalti"});
        if(!payment){
            return res.send(Message("Payment details mismatch. Please contact us at contact@aakhyaan.org."));
        }
        if(payment.used){
            return res.send(Message("Payment is aleady verified."));
        }
        if(payment.amount != amount 
            || payment.order_id != purchase_order_id
        ){
            return res.send(Message("Payment details mismatch. Please contact us at contact@aakhyaan.org."));
        }
        
        let confirmationUrl = baseUrl + '/epayment/lookup/';
        const response = await axios.post(
            confirmationUrl,
            {
                pidx: pidx
            },{
                headers: authorization
            }
        );

        console.log(response);

        if(!response.data){
            return res.send(Message("Error processing the payment. Please try again later or try contacting us."));
        }

        if(response.data.transaction_id != transaction_id){
            return res.send(Message("Payment details mismatch. Please contact us at contact@aakhyaan.org."));
        }

        let [programId, userId, time] = purchase_order_id.split("_");
        switch(response.data.status){
            case "Completed":
                await Payment.updateOne({_id: payment._id}, {$set: {
                    status: "Completed",
                    used: true,
                    transaction_id,
                    mobile,
                }})
                await User.updateOne({_id: payment.user}, {$push:  { programs: {
                    programId,
                    programName: payment.programName,
                }}});
                // await Program.updateOne({_id: programId}, {$push: {users: userId}})
                return res.send(Message("Payment is Completed. Now you have access to our resources."));
            case "Pending":
                Payment.updateOne({pidx: pidx, gateWay: "Khalti"}, {$set: {state: "Pending"}})
                return res.send(Message("Payment is in Pending."));
            case "Refunded":
                Payment.updateOne({pidx: pidx, gateWay: "Khalti"}, {$set: {state: "Refunded"}})
                return res.send(Message("Payment is Refunded."));
            case "Expired":
                Payment.updateOne({pidx: pidx, gateWay: "Khalti"}, {$set: {state: "Expired"}})
                return res.send(Message("Payment is Expired. Please initiate the payment again."));
            default:
                return res.send(Message("Error processing the payment. Please try again later or try contacting us."));
        }

    }catch(err){
        console.log(err);
        return res.send(err);
    }

}
