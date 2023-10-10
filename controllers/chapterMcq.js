const ChapterMcq = require("../model/chapterMcq");
const User = require("../model/user");

const { hasPermission } = require("../middleware/permission");
const Message = require("../config/message");
const Chapter = require("../model/chapter");
const ObjectId =  require("mongoose").ObjectId;

// exports.listChapterMcqs = async (req, res) => {
//   let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  
//   try {
//     const mcqs = await ChapterMcq.aggregate([{
//       $match: { published: { $in: [true, publishedType]} }
//     }, {
//       $addFields: { questionCount: {$size: "$questions" } } 
//     },{
//       $project: { "questions": 0 }
//     }]);
//     res.send(Message("", true, mcqs));
//   } catch (err) {
//     console.log(err);
//     return res.send(Message(err.message));
//   }
// };

exports.listChapterMcq = async (req, res) => {
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  let { chapterId } = req.params;

  try {
    const currentChapter = await Chapter.findById(chapterId);
    if(!currentChapter) return res.send(Message("Chapter doesnot exist."))
    const mcqs = await ChapterMcq.aggregate([{
      $match: { 
        published: { $in: [true, publishedType]},
        _id: { $in: currentChapter.mcq } 
      }
    }, {
      $addFields: { questionCount: {$size: "$questions" } } 
    },{
      $project: { "questions": 0 }
    }]);
    res.send(Message("", true, mcqs));
  } catch (err) {
    console.log(err);
    return res.send(Message("Unknown error occurred"));
  }
};

exports.getChapterMcq = async(req, res) => {
  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const {mcqId} = req.params;
  if(!mcqId) return res.send(Message("McqId is required"));

  try {

    // if(currentUser.programs.find(program => program.programId === programId)){
    //   return res.send(Message("User already enrolled", true, {
    //     enrollStatus: true
    //   }));
    // }

    const mcq = await ChapterMcq.findOne({"_id": mcqId});
    if(mcq){
      res.send(Message("", true, mcq));
    }else{
      return res.send(Message("Mcq not found"))
    }
  } catch (err) {
    return res.send(Message("Unknown error occurred."));
  }
}

exports.createChapterMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "createMcq")) return res.status(401).send(Message("User Unauthorized."));
  let { title, explanation, duration, negMark, chapterId } = req.body;
 
  if (!title) return res.send(Message("Title is required"));
  title = title.trim();
  let _id = `${title}`.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  while (true) {
    const duplicateChapterMcq = await ChapterMcq.findOne({ _id: _id });
    if (!duplicateChapterMcq) break;
    _id = `${_id}${Math.floor(Math.random() * 10)}`;
  }

  try {
    const currentChapter = await Chapter.findById(chapterId)
    if(!currentChapter) return res.send(Message("Chapter doesnot exist."))

    const newChapterMcq = new ChapterMcq({
      _id,
      title,
      enabled: false,
      published: false,
      explanation,
      duration: duration + 0.2,
      negMark,
      startTime: 0,
      endTime: 0,
      questions: [],
    });

    await newChapterMcq.save();
    await Chapter.findOneAndUpdate({_id: chapterId}, {
      $push: { mcq: _id}
    })
    return res.send(Message("Mcq created successfully", true));
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  } };

exports.editChapterMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { title, explanation, mcqId, published, duration, negMark } = req.body;
  
  try {
    const currentChapterMcq = await ChapterMcq.findById(mcqId);
    if(!currentChapterMcq) return res.send("Mcq not found");

    currentChapterMcq.title = title;
    currentChapterMcq.explanation = explanation;
    currentChapterMcq.negMark = negMark;
    currentChapterMcq.published = published;
    currentChapterMcq.duration = duration + 0.2;

    await currentChapterMcq.save();
    return res.send(Message("Mcq edited successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.mesasge));
  }
};

exports.enableChapterMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { enabled, mcqId } = req.body;
  console.log(enabled, mcqId);
  
  try {
    const currentChapterMcq = await ChapterMcq.findById(mcqId);
    if(!currentChapterMcq) return res.send("Mcq not found");

    if(enabled === true){
      currentChapterMcq.startTime = Date.now();
      currentChapterMcq.endTime = Date.now() + currentChapterMcq.duration*60*1000;
    }

    currentChapterMcq.enabled = enabled;

    await currentChapterMcq.save();
    return res.send(Message("Mcq edited successfully", true));
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  }
}

exports.deleteChapterMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "deleteMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { mcqId, chapterId } = req.body;
  
  try {
    await ChapterMcq.findOneAndDelete({_id: mcqId});
    await Chapter.findOneAndUpdate({_id: chapterId}, {$pull: {mcq: mcqId}});
    return res.send(Message("Mcq deleted successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.mesasge));
  }
};

exports.appendQuestion = async (req, res) => {
  if (!hasPermission(req.user?.type, "editMcq")) return res.status(401).send(Message("User Unauthorized."));
  const { question, questionImage, mcqId, weight, options, answer, explanation, explanationImage } = req.body;

  try {

    const currentChapterMcq = await ChapterMcq.findById(mcqId);
    if(!currentChapterMcq) return res.send("Mcq not found.");
    
    let sn;
    if(currentChapterMcq.questions.length>0){
      sn = Math.max(...currentChapterMcq.questions.map(question => question.sn)) + 1;
    }else{
      sn = 1;
    }
    
    currentChapterMcq.questions.push({
      sn,
      question,
      questionImage,
      weight,
      options,
      answer,
      explanation,
      explanationImage
    });

    await currentChapterMcq.save();
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

    let currentChapterMcq = await ChapterMcq.findOne({"_id": mcqId, "question._id": questionId});
    if(!currentChapterMcq) return res.send(Message("Mcq not found"));

    let updatedOne = await ChapterMcq.findOneAndUpdate(
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

    await ChapterMcq.updateOne(
      {_id: mcqId},
      {"$pull": { "questions": { "_id": questionId}} },
    )
    
    return res.send(Message("Question deleted successfully", true));

  } catch (err) {
    console.log(err);
    return res.status(400).send(Message("Unknown error occurred"));
  }
}
