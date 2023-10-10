const User = require("../model/user");
const Mcq = require("../model/mcq");
const csvtojson = require("csvtojson");
const busboy = require("busboy");

const { hasPermission } = require("../middleware/permission");
const Message = require("../config/message");

exports.getUsersSubmissions = async (req, res) => {

  if (!hasPermission(req.user?.type, "manageUser")) return res.status(401).send(Message("User Unauthorized."));

  let {mcqId} = req.params;

  try{

    let currentMcq = await Mcq.findById(mcqId);
    if(!currentMcq) return res.send(Message("Mcq not found"));

    let validSubmissions = await User.aggregate([
      { $unwind: { path: "$solvedMcq" }},
      { $match: { "solvedMcq.mcqId": mcqId }},
      { $group: {
        _id: "$solvedMcq.mcqId",
        submissions: {
          $push: {
            userId: "$id",
            submissionId: "$solvedMcq._id",
            firstName: "$firstName",
            lastName: "$lastName",
            email: "$email",
            phone: "$phone",
            startTime: "$solvedMcq.startTime",
            endTime: "$solvedMcq.endTime",
            answer: "$solvedMcq.answers"
          }
        }
      }}
    ])

    let results = {
      ...validSubmissions[0],
      ...currentMcq._doc
    }

    return res.send(Message("", true, results));
  }catch(err){
    console.log(err);
    return res.status(400).send(Message("Error fetching MCQs"));
  }
}

const getFileContent = async(req) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ 
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: 5*1024*1024
      }
    });
    bb.on('error', err => reject(err));

    let fileStream = [];

    bb.on('file', async(fieldName, file, fileInfo) => {
      file.on('data', stream => fileStream.push(stream))
      file.on('end', () => resolve(fileStream));
    })
    req.pipe(bb);

  })
}
exports.importCSV = async(req, res) => {
  if (!hasPermission(req.user?.type, "manageUser")) return res.status(401).send(Message("User Unauthorized."));
  try{
    const {mcqId} = req.params;
    let currentMcq = await Mcq.findById(mcqId);
    if(!currentMcq) return res.send("Mcq doesn't exist.")
    let sn;
    if(currentMcq.questions.length>0){
      sn = Math.max(...currentMcq.questions.map(question => question.sn)) + 1;
    }else{
      sn = 1;
    }
    let csvData = (await getFileContent(req)).toString();

    let jsonData = await csvtojson().fromString(csvData)
    jsonData.forEach(dat => {
      dat.sn = sn;
      sn++;
    })
    const result = await Mcq.updateOne({_id: mcqId}, {
      $push: {
        questions: { $each: jsonData }
      }
    })
    if(result?.modifiedCount){
      return res.send(Message("Data saved successfully", true));
    }else{
      return res.send(Message("Error saving data."));
    }
  }catch(err){
    console.log(err);
    return res.send(err);
    return res.send(Message("Unknown error occurred."));
  }
}