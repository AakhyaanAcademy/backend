const Course = require("../model/course");
const Chapter = require("../model/chapter");
const Topic = require("../model/topic");

const Message = require("../config/message");

const { hasPermission } = require("../middleware/permission");

exports.getTopics = async (req, res) => {
  const { chapterId } = req.params;
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  try {
    const currentChapter = await Chapter.findOne({ _id: chapterId, published: { $in: [true, publishedType] } });
    if (!currentChapter)
      return res.status(404).send(Message("Chapter not found."));

    const topics = await Topic.find(
      { _id: { $in: currentChapter.topic }, published: { $in: [true, publishedType] } },
      { _id: 1, title: 1, published: 1, sn: 1 }
    );
    return res.send(
      Message("", true, {
        topics,
      })
    );
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.getTopic = async (req, res) => {
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  const { topicId } = req.params;
  const topic = await Topic.findOne({ "_id": topicId, published: { $in: [true, publishedType] } });

  if (topic) return res.send(Message("", true, topic));
  return res.status(404).send(Message("Topic not found."));
};

exports.createTopic = async (req, res) => {
  if (!hasPermission(req.user?.type, "createTopic"))
    return res.status(401).send(Message("User Unauthorized."));
  let { chapterId, sn, title } = req.body;
  title = title.trim();

  try {
    const currentChapter = await Chapter.findOne({ _id: chapterId });
    if (!currentChapter) return res.send(Message("No Such Chapter"));

    let _id = `${title}`.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

    while (true) {
      const duplicateTopic = await Topic.findOne({ _id: _id });
      if (!duplicateTopic) break;
      _id = `${_id}${Math.floor(Math.random() * 10)}`;
    }

    const newTopic = new Topic({
      _id: _id,
      title: title,
      sn: sn,
      content: "",
      mcq: [],
    });

    await newTopic.save();
    await Chapter.updateOne({ _id: chapterId }, { $push: { topic: _id } });
    return res.send(Message("Topic Created Successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.editTopic = async (req, res) => {
  if (!hasPermission(req.user?.type, "editTopic"))
    return res.status(401).send(Message("User Unauthorized."));

  const { topicId, topicTitle, topicContent, published, sn, topicEditor } = req.body;
  try {
    //check if course exists
    const currentTopic = await Topic.findOne({ _id: topicId });
    if (!currentTopic) return res.send(Message("No Such Topic"));
    //modify course title and tag

    let newTopic = {
      sn: (typeof sn === "undefined") ? currentTopic.sn : sn,
      title: (typeof topicTitle === "undefined") ? currentTopic.title : topicTitle,
      published: (typeof published === "undefined") ? currentTopic.published : published,
      content: (typeof topicContent === "undefined") ? currentTopic.content : topicContent,
      editor: (typeof topicEditor === "undefined") ? currentTopic.editor : topicEditor,
      mcq: currentTopic.mcq 
    }

    await Topic.findOneAndUpdate({ _id: topicId }, {
      $set: newTopic
    })


    return res.send(Message("Topic Saved Successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.appendQuestionInTopic = async(req, res) => {
  if (!hasPermission(req.user?.type, "editTopic")) return res.status(401).send(Message("User Unauthorized."));
  const { topicId, question, questionImage, options, answer, weight, explanation, explanationImage } = req.body;

  try {

    let newQuestion = {
      question,
      questionImage,
      weight,
      options,
      answer,
      explanation,
      explanationImage
    };
    let resp = await Topic.updateOne({_id: topicId}, {$push: { mcq: newQuestion}})

    if(!resp.matchedCount){
      return res.send(Message("Topic not found"));
    }

    return res.send(Message("Question added successfully", true));
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  }

}

exports.editQuestionInTopic = async(req, res) => {
  if (!hasPermission(req.user?.type, "editTopic")) return res.status(401).send(Message("User Unauthorized."));
  const { topicId, questionId, question, questionImage, options, answer, weight, explanation, explanationImage } = req.body;

  try {

    let newQuestion = {
      question,
      questionImage,
      weight,
      options,
      answer,
      explanation,
      explanationImage
    };
    let resp = await Topic.updateOne({_id: topicId, "mcq._id": questionId}, {$set: { 
      "mcq.$": newQuestion
    }})

    if(!resp.matchedCount){
      return res.send(Message("Topic or question not found"));
    }

    return res.send(Message("Question edited successfully", true));
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  }

}
exports.deleteQuestionInTopic = async(req, res) => {
  if (!hasPermission(req.user?.type, "editTopic")) return res.status(401).send(Message("User Unauthorized."));
  const { topicId, questionId} = req.body;

  try {
    let resp = await Topic.updateOne({_id: topicId}, {$pull: { mcq: { _id: questionId}}});

    console.log(resp);
    if(!resp.matchedCount){
      return res.send(Message("Topic not found"));
    }

    return res.send(Message("Question deleted successfully", true));
    
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  }

}
exports.deleteTopic = async (req, res) => {
  if (!hasPermission(req.user?.type, "deleteTopic"))
    return res.status(401).send(Message("User Unauthorized."));
  const { topicId, chapterId } = req.body;

  try {
    //check if course exists
    const currentTopic = await Topic.findOne({ _id: topicId });
    if (!currentTopic) return res.send(Message("No Such Topic."));


    await currentTopic.delete();
    await Chapter.updateOne({ _id: chapterId }, { $pull: { topic: topicId } });
    return res.send(Message("Topic deleted Successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};
