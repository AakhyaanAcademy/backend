const Mcq = require("../model/mcq");
const User = require("../model/user");

const { hasPermission } = require("../middleware/permission");
const Message = require("../config/message");
const ObjectId =  require("mongoose").ObjectId;

exports.listMcqs = async (req, res) => {
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  
  try {
    const mcqs = await Mcq.aggregate([{
      $match: { published: { $in: [true, publishedType]} }
    }, {
      $addFields: { questionCount: {$size: "$questions" } } 
    },{
      $project: { "questions": 0 }
    }]);
    res.send(Message("", true, mcqs));
  } catch (err) {
    console.log(err);
    return res.send(Message(err.message));
  }
};

exports.listMcqByCourse = async (req, res) => {
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  let { courseId } = req.params;
  console.log(courseId);

  try {
    const mcqs = await Mcq.aggregate([{
      $match: { 
        published: { $in: [true, publishedType]},
        courseId: courseId 
      }
    }, {
      $addFields: { questionCount: {$size: "$questions" } } 
    },{
      $project: { "questions": 0 }
    }]);
    res.send(Message("", true, mcqs));
  } catch (err) {
    console.log(err);
    return res.send(Message(err.message));
  }
};

exports.getMcq = async(req, res) => {
  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const {mcqId} = req.params;
  if(!mcqId) return res.send(Message("McqId is required"));

  try {
    const mcq = await Mcq.findOne({"_id": mcqId});
    if(mcq){
      res.send(Message("", true, mcq));
    }else{
      return res.send(Message("Mcq not found"))
    }
  } catch (err) {
    return res.send(Message(err.message));
  }
}

exports.createMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "createMcq")) return res.status(401).send(Message("User Unauthorized."));
  let { title, explanation, duration, negMark, courseId } = req.body;
 
  if (!title) return res.send(Message("Title is required"));
  title = title.trim();
  let _id = `${title}`.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  while (true) {
    const duplicateMcq = await Mcq.findOne({ _id: _id });
    if (!duplicateMcq) break;
    _id = `${_id}${Math.floor(Math.random() * 10)}`;
  }

  try {
    const newMcq = new Mcq({
      _id,
      title,
      enabled: false,
      published: false,
      explanation,
      duration: duration + 0.2,
      negMark,
      startTime: 0,
      endTime: 0,
      courseId,
      questions: [],
    });

    await newMcq.save();
    return res.send(Message("Mcq created successfully", true));
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  } };

exports.editMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { title, explanation, mcqId, published, duration, negMark, courseId  } = req.body;
  
  try {
    const currentMcq = await Mcq.findById(mcqId);
    if(!currentMcq) return res.send("Mcq not found");

    currentMcq.title = title;
    currentMcq.explanation = explanation;
    currentMcq.negMark = negMark;
    currentMcq.published = published;
    currentMcq.duration = duration + 0.2;
    currentMcq.courseId = courseId;

    await currentMcq.save();
    return res.send(Message("Mcq edited successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.mesasge));
  }
};

exports.enableMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { enabled, mcqId } = req.body;
  console.log(enabled, mcqId);
  
  try {
    const currentMcq = await Mcq.findById(mcqId);
    if(!currentMcq) return res.send("Mcq not found");

    if(enabled === true){
      currentMcq.startTime = Date.now();
      currentMcq.endTime = Date.now() + currentMcq.duration*60*1000;
    }

    currentMcq.enabled = enabled;

    await currentMcq.save();
    return res.send(Message("Mcq edited successfully", true));
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  }
}

exports.deleteMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "deleteMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { mcqId } = req.body;
  
  try {
    await Mcq.findOneAndDelete({_id: mcqId});
    return res.send(Message("Mcq deleted successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.mesasge));
  }
};

exports.appendQuestion = async (req, res) => {
  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { question, questionImage, mcqId, weight, options, answer, explanation, explanationImage } = req.body;

  try {

    const currentMcq = await Mcq.findById(mcqId);
    if(!currentMcq) return res.send("Mcq not found.");
    
    let sn;
    if(currentMcq.questions.length>0){
      sn = Math.max(...currentMcq.questions.map(question => question.sn)) + 1;
    }else{
      sn = 1;
    }
    
    currentMcq.questions.push({
      sn,
      question,
      questionImage,
      weight,
      options,
      answer,
      explanation,
      explanationImage
    });

    await currentMcq.save();
    return res.send(Message("Question added successfully", true));
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  }
};


exports.editQuestion = async (req, res) => {

  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { question, questionImage, mcqId, questionId, weight, options, answer, explanation, explanationImage } = req.body;

  try {

    let currentMcq = await Mcq.findOne({"_id": mcqId, "question._id": questionId});
    if(!currentMcq) return res.send(Message("Mcq not found"));

    let updatedOne = await Mcq.findOneAndUpdate(
      {_id: mcqId, "questions._id": questionId},
      { "$set": {
        "questions.$.question": question,
        "questions.$.questionImage": questionImage,
        "questions.$.weight": weight,
        "questions.$.options": options,
        "questions.$.answer": answer,
        "questions.$.explanation": explanation,
        "questions.$.explanationImage": explanationImage
      }},
      {new: true}
    )
    
    if(updatedOne){
      return res.send(Message("Question updated successfully", true, updatedOne));
    }else{
      return res.send(Message("Question or Mcq doesn't exist"));
    }

  } catch (err) {
    console.log(err);
    return res.status(400).send(Message("Unknown error occurred"));
  }
}


exports.deleteQuestion = async (req, res) => {

  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { mcqId, questionId } = req.body;

  try {

    await Mcq.updateOne(
      {_id: mcqId},
      {"$pull": { "questions": { "_id": questionId}} },
    )
    
    return res.send(Message("Question deleted successfully", true));

  } catch (err) {
    console.log(err);
    return res.status(400).send(Message("Unknown error occurred"));
  }
}
