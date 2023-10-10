const mongoose = require("mongoose");
const {ObjectId} = require("mongoose");

const ProgramSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  isValid: {
    type: Boolean,
    default: false,
  },
  courseId: {
    type: String,
    default: null
  },
  paymentPicture: [{
    url: {
      type: String,
      required: true
    },
    date: {
      type: Number,
      required: true
    },
    user:{
      type: ObjectId,
      required: true
    },
    isVerified: {
      type: Number,
      default: 1,
    } 
  }],
});

const Program = mongoose.model("Program", ProgramSchema);

module.exports = Program;
