const mongoose = require("mongoose");

const CourseSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  published: {
    type: Boolean,
    default: false,
  },
  thumbnail: {
    type: String,
    required: false,
  },
  subject: [String],
});

const Course = mongoose.model("Course", CourseSchema);

Course.createIndexes();
module.exports = Course;
