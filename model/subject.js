const mongoose = require("mongoose");

const SubjectSchema = mongoose.Schema({
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
    published: {
        type: Boolean,
        default: false,
    },
    chapter: [{type: String, ref: "Chapter"}]
})


const Subject = mongoose.model('subject', SubjectSchema);

module.exports = Subject;