const mongoose = require("mongoose");

const TopicSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    sn: {
        type: Number,
        required: false
    },
    title: {
        type: String,
        required: true,
    },
    published: {
        type: Boolean,
        default: false,
    },
    content: {
        type: String,
        required: false
    },
    editor: {
        type: String,
        required: false
    },
    mcq: [{
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
            default: null
        },
        answer: {
            type: Number,
            required: true,
        },
        explanation: {
            type: String,
            default: null,
        },
        explanationImage: {
            type: String,
            default: null, 
        },
        options: [{
            text: String,
            image: String
        }],
    }]
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
})

const Topic = mongoose.model('Topic', TopicSchema);

module.exports = Topic;