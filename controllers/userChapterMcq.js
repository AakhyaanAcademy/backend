const User = require("../model/user");
const Chapter = require("../model/chapter");
const ChapterMcq = require("../model/chapterMcq");

const { hasPermission } = require("../middleware/permission");
const Message = require("../config/message");

exports.getSubmissions = async (req, res) => {

  if(!req.user) return res.send(Message("You must login first."));

  try{
    let submissions = [];
    req.user.solvedChapterMcq.forEach( submission => {
      submissions.push({
        mcqTitle: submission.mcqTitle,
        mcqId: submission.mcqId,
        startTime: submission.startTime,
        endTime: submission.endTime,
        chapterId: submission.chatperId,
        currentTime: Date.now(),
        submissionId: submission._id
      })
    })
    return res.send(Message("", true, submissions));
  }catch(err){
    console.log(err);
    return res.status(400).send(Message("Error getting Submission."));
  }
}

exports.getSubmissionsByChapter = async (req, res) => {

  if(!req.user) return res.send(Message("You must login first."));
  const {chapterId} = req.params;

  try{
    const currentChapter = await Chapter.findById(chapterId);
    if(!currentChapter) return res.status(400).send(Message("Chapter not found."))


    let submissions = [];
    req.user.solvedChapterMcq.forEach( submission => {
      if(currentChapter.mcq.includes(submission.mcqId)){
        submissions.push({
          mcqTitle: submission.mcqTitle,
          mcqId: submission.mcqId,
          startTime: submission.startTime,
          endTime: submission.endTime,
          chapterId: submission.chatperId,
          currentTime: Date.now(),
          submissionId: submission._id
        })
      }
    })
    return res.send(Message("", true, submissions));
  }catch(err){
    console.log(err);
    return res.status(400).send(Message("Error getting Submission."));
  }

}

exports.getSubmission = async (req, res) => {
  if(!req.user) return res.send(Message("You need to login first."));

  const { submissionId } = req.params;

  try{
    let submission = req.user.solvedChapterMcq.find(sub => sub._id.toString() === submissionId);
    if(!submission){
      return res.status(400).send(Message("Invalid Submission ID."));
    }

    
    if(submission.endTime > Date.now()){
      return res.status(400).send(Message("You must submit the answers first."));
    }
    
    let currentMcq = await ChapterMcq.findById(submission.mcqId);
    if(currentMcq.endTime > Date.now()){
      return res.status(400).send(Message("Exam is not over yet."));
    }
  
    if(!currentMcq || !currentMcq.published){
      return res.status(400).send(Message("Mcq unpublished by admins."));
    }

    return res.send(Message("", true, {submission, mcq: currentMcq}));
  }catch(err){
    return res.send(400).send(Message("Unknown error occurred."))
  };
}

exports.preCheckMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "takeExam")) return res.status(401).send(Message("You need to login first."));

  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  const { mcqId } = req.body;

  try{
    const currentMcq = await ChapterMcq.findOne({"_id": mcqId, published: { $in: [true, publishedType]}});
    
    if(!currentMcq) return res.status(400).send(Message("Mcq doesn't exist"));
    if(!currentMcq.enabled) return res.status(400).send(Message("Mcq is not available at the moment. It will be available soon."));

    let currentUser = await User.findById(req.user._id);

    let programs = ["ioe-entrance-preparation-2080", "pre-engineering-entrance-preparation-2081"]
    let currentUserPrograms = [...currentUser.programs?.map(program => program.programId)];
    if(!programs.some(program => currentUserPrograms.includes(program))){
      return res.status(400).send(Message("You need to make payment before taking the test."))
    }
    // if(!currentUser.programs?.map(program => program.programId).includes("ioe-entrance-preparation-2080")){
    //   return res.status(400).send(Message("You need to make payment before taking the test."))
    // }

    let latestSubmission = currentUser?.solvedChapterMcq[currentUser.solvedChapterMcq?.length -1];

    if(latestSubmission && latestSubmission.endTime > Date.now()){
      if(latestSubmission.mcqId === currentMcq._id){
        return res.send(Message("Exam is in progress. It will be resumed.", true, { 
          status: {
            startTime: latestSubmission.startTime,
            endTime: latestSubmission.endTime,
            currentTime: Date.now() 
          },
        }));
      }else{
        return res.status(400).send(Message(
          "You already have a test running. Submit that test before starting another.",
          false,
          {"mcqId": latestSubmission.mcqId, "mcqTitle": latestSubmission.mcqTitle}
        ));
      }
    }else{
      let startTime = currentMcq.endTime - currentMcq.duration * 60000;
      if(currentMcq.endTime > Date.now() && currentUser.solvedChapterMcq.some(mcq => ((mcq.mcqId === currentMcq._id) && (mcq.endTime > startTime )))){
        return res.send(Message(`You have already given the test. You will be able to practice it after ${Math.ceil((currentMcq.endTime - Date.now())/60000)} minutes.`))
      }
    }
    return res.send(Message("Exam will be started.", true));
    
  }catch(err){
    console.log(err);
    return res.status(400).send(Message("Error starting MCQ"));
  }

}


exports.startMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "takeExam")) return res.status(401).send(Message("User Unauthorized."));

  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  const { mcqId, chapterId } = req.body;

  try{
    const currentMcq = await ChapterMcq.findOne({"_id": mcqId, published: { $in: [true, publishedType]}}, {"questions.answer": 0, "questions.explanation": 0});
    
    if(!currentMcq) return res.status(400).send(Message("Mcq doesn't exist"));
    if(!currentMcq.enabled) return res.status(400).send(Message("Mcq is not available at the moment. It will be available soon."));

    let currentUser = await User.findById(req.user._id);

    let programs = ["ioe-entrance-preparation-2080", "pre-engineering-entrance-preparation-2081"]
    let currentUserPrograms = [...currentUser.programs?.map(program => program.programId)];
    if(!programs.some(program => currentUserPrograms.includes(program))){
      return res.status(400).send(Message("You need to make payment before taking the test."))
    }

    let latestSubmission = currentUser?.solvedChapterMcq[currentUser.solvedChapterMcq?.length -1];

    if(latestSubmission && latestSubmission.endTime > Date.now()){
      if(latestSubmission.mcqId === currentMcq._id){
        return res.send(Message("", true, { 
          status: {
            startTime: latestSubmission.startTime,
            endTime: latestSubmission.endTime,
            answers: latestSubmission.answers,
            currentTime: Date.now() 
          },
          mcq: currentMcq
        }));
      }else{
        return res.status(400).send(Message("You need to finish running test before starting another.", false, {mcqId: latestSubmission.mcqId}));
      }
    }else{
      let startTime = currentMcq.endTime - currentMcq.duration * 60000;
      if(currentMcq.endTime > Date.now() && currentUser.solvedChapterMcq.some(mcq => ((mcq.mcqId === currentMcq._id) && (mcq.endTime > startTime )))){
        return res.send(Message(`You have already given the test. You will be able to practice it after ${Math.ceil((currentMcq.endTime - Date.now())/60000)} minutes.`))
      }
    }
    let endTime = currentMcq.endTime > Date.now() ? currentMcq.endTime : Date.now() + currentMcq.duration * 60000;
   
    let newSubmission = {
      mcqId: currentMcq._id,
      mcqTitle: currentMcq.title,
      startTime: Date.now(),
      chapterId: chapterId,
      endTime,
      answers: [],
    }

    await User.updateOne({
      _id: req.user._id,
    },{
      $push: { "solvedChapterMcq": newSubmission }
    })

    return res.send(Message("Exam Started.", true, {
      status: { ...newSubmission, currentTime: Date.now() },
      mcq: currentMcq 
    }));

  }catch(err){
    console.log(err);
    return res.status(400).send(Message("Error starting MCQ"));
  }
}

exports.saveMcq = async (req, res) => {
  if(!req.user) return res.send(Message("You need to login first"));
  if (!hasPermission(req.user?.type, "takeExam")) return res.status(401).send(Message("User Unauthorized."));

  const { answers, mcqId } = req.body;

  try{
    const currentMcq = await ChapterMcq.findById(mcqId);
    
    if(!currentMcq) return res.status(400).send(Message("Mcq doesn't exist"));
    if(!currentMcq.enabled || !currentMcq.published) return res.status(400).send(Message("Mcq submission is disabled."));
    
    let result = await User.updateOne({
      _id: req.user._id,
      "solvedChapterMcq.endTime": { $gt: Date.now() }
    },{
      "solvedChapterMcq.$.answers": answers
    })

    if(result?.modifiedCount){
      return res.send(Message("Data saved successfully", true, {currentTime: Date.now()}));
    }else{
      return res.send(Message("Either exam is not started yet or exam is already over."));
    }

  }catch(err){
    console.log(err);
    return res.status(400).send(Message("Error saving MCQ"));
  }
}


exports.submitMcq = async (req, res) => {
  if (!hasPermission(req.user?.type, "takeExam")) return res.status(401).send(Message("User Unauthorized."));

  const { answers, mcqId } = req.body;

  try{
    const currentMcq = await ChapterMcq.findById(mcqId);
    
    if(!currentMcq) return res.status(400).send(Message("Mcq doesn't exist"));
    if(!currentMcq.enabled || !currentMcq.published) return res.status(400).send(Message("Mcq submission is disabled."));

    let result = await User.updateOne({
      _id: req.user._id,
      "solvedChapterMcq.endTime": { $gt: Date.now() }
    },{
      "solvedChapterMcq.$.answers": answers,
      "solvedChapterMcq.$.endTime": Date.now(),
    })

    if(result?.modifiedCount){
      return res.send(Message("Data saved successfully", true));
    }else{
      return res.send(Message("Either exam is not given or it is already over."));
    }

  }catch(err){
    console.log(err);
    return res.status(400).send(Message("Error submitting MCQ"));
  }
}