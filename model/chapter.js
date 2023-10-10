const mongoose = require("mongoose");

const ChapterSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    sn: {
        type: Number,
        requried: false 
    },
    title: {
        type: String,
        required: true,
    },
    published: {
        type: Boolean,
        default: false,
    },
    topic: [{type: String, ref: "Topic"}],
    mcq: [{type: String, ref: "ChapterMcq"}]
})


const Chapter = mongoose.model('chapter', ChapterSchema);

Chapter.createIndexes();

module.exports = Chapter;