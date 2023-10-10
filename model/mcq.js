const mongoose = require("mongoose");
const ObjectId = require("mongoose").ObjectId;

const questionSchema = {
  sn: {
    type: Number,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  questionImage: {
    type: String,
    default: null
  },
  weight: {
    type: Number,
    required: true,
  },
  answer: {
    type: Number,
    required: true,
  },
  explanation: {
    type: String,
    required: false,
  },
  explanationImage: {
    type: String,
    required: false
  },
  options: [{
    text: String,
    image: {
      type: String,
      default: null
    }
  }],
};

const mcqSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  courseId: {
    type: String,
    default: null
  },
  title: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: false
  },
  published:{
    type: Boolean,
    default: false,
  },
  explanation: {
    type: String,
    default: "",
  },
  negMark: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 7200
  },
  endTime: {
    type: Number,
    required: true
  },
  startTime: {
    type: Number,
    required: true,
  },
  questions: [questionSchema],
});

const Mcq = mongoose.model("Mcq", mcqSchema);

module.exports = Mcq;
