const User = require("../model/user");
const Program = require("../model/program");
const Message = require("../config/message");
const { hasPermission } = require("../middleware/permission");

const {
  ssUploader,
  getSignedObjectUrl,
} = require("../middleware/s3FileHandler");
const Payment = require("../model/payment");

exports.getPayment = async(req, res) => {

  if (!req.user) return res.status(401).send(Message("Invalid User"));
  const {programId} = req.params;
  try{
    const currentUser = await User.findOne({_id: req.user._id}, {programs: 1});
    if (!currentUser) return res.status(401).send(Message("Invalid User."));

    let enrollStatus = currentUser.programs.find(program => program.programId === programId) ? true : false;
   
    const currentProgram = await Program.findOne({_id: programId});
    if (!currentProgram) return res.status(401).send(Message("Invalid Program."));
   
    let paymentPic = currentProgram.paymentPicture.find(pic => pic.user.equals(currentUser._id));
    if(paymentPic){
      paymentPic.url = await getSignedObjectUrl(paymentPic.url);
    } 
    let epayment = await Payment.findOne({user: currentUser._id, used: true})
    return res.send(Message("User not enrolled", true, {
      enrollStatus,
      paymentPic,
      epayment,
    }));

  }catch(err){
    console.log(err);
    return res.send(Message("Unknown error occurred."));
  }
}

exports.uploadSS = async (req, res) => {
  if (!req.user) return res.status(401).send(Message("Invalid User"));
  const {programId} = req.params;

  try {
    // const currentUser = await User.findById(req.user._id);
    if (!req.user) return res.status(401).send(Message("Invalid User."));
    // if (!currentUser.isVerified) return res.status(401).send(Message("Email not verified."));
    
    const currentProgram = await Program.findById(programId);
    if (!currentProgram || !currentProgram.isValid) return res.status(401).send(Message("Invalid Program."));

    let ssUrl = await ssUploader(req, programId);
   
    if(!ssUrl.Key) return res.send(Message("Unknonwn error occurred."));
    
    ssUrl = `${ssUrl.Key}`;

    const prevPic = currentProgram.paymentPicture?.find(pic => pic.user.equals(req.user._id));
    console.log(prevPic);
    console.log(currentProgram.paymentPicture);
    console.log(req.user._id)
    if(prevPic){
      prevPic.url = ssUrl;
      prevPic.date = Date.now();
      prevPic.isVerified = 1
    }else{
      currentProgram.paymentPicture.push({
        url: ssUrl,
        date: Date.now(),
        user: req.user._id,
        isValid: false
      });
    }
    await currentProgram.save();

    let signedUrl = await getSignedObjectUrl(ssUrl);
    return res.send(
      Message("Image Uploaded succcessfully.", true, { paymentUrl: signedUrl })
    );
  } catch (err) {
    console.log(err);
    return res.send(Message("Unknown error occurred."));
  }
};

exports.verifySS = async(req, res) => {
  if (!hasPermission(req.user?.type, "manageUser")) return res.status(401).send(Message("User Unauthorized."));
  const {userId, programId} = req.body;
  try{
    const currentProgram = await Program.findOneAndUpdate({_id: programId, "paymentPicture.user": userId}, {
      $set: {
       "paymentPicture.$.isVerified": 2 
      }
    })

    if(!currentProgram){
      return res.send(Message("No payment picture by user in given program."));
    }

    await User.findOneAndUpdate({_id: userId}, {$push: {programs: { programId, programName: currentProgram.title}}})
    return res.send(Message("Payment verified successfully."));
  }catch(err){
    console.log(err);
    return res.send(Message("Unknown error occurred."))
  }
}

exports.rejectSS = async(req, res) => {
  if (!hasPermission(req.user?.type, "manageUser")) return res.status(401).send(Message("User Unauthorized."));
  const {userId, programId} = req.body;
  try{
    const currentProgram = await Program.findOneAndUpdate({_id: programId, "paymentPicture.user": userId}, {
      $set: {
       "paymentPicture.$.isVerified": 0 
      }
    })

    if(!currentProgram){
      return res.send(Message("No payment picture by user in given program."));
    }

    await User.findOneAndUpdate({_id: userId}, {$pull: {programs: { programId}}})

    // await User.findOneAndUpdate({_id: userId}, {$push: {programs: { programId, programName: currentProgram.title}}})
    return res.send(Message("Payment rejected successfully."));
  }catch(err){
    console.log(err);
    return res.send(Message("Unknown error occurred."))
  }
}

exports.listPayment = async (req, res) => {
  if (!hasPermission(req.user?.type, "manageUser")) return res.status(401).send(Message("User Unauthorized."));
  let {programId} = req.params;

 try{
  let entries = await Program.aggregate([
    { $match: {_id: programId} },
    { $unwind: {path: '$paymentPicture'}},
    { $replaceRoot: { newRoot: "$paymentPicture"}},
    { $lookup: {
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: { path: "$user" }},
    { $project: {
      url: 1,
      date: 1,
      isVerified: 1,
      "user.email": 1,
      "user.firstName": 1,
      "user.lastName": 1,
      "user.phone": 1,
      "user._id": 1
    }}
  ])
  let pictures = [];
  for(let pic of entries){
    pictures.push({
      ...pic,
      url: await getSignedObjectUrl(pic.url)
    })
  }
  return res.send(Message("", true, pictures));    
  
 }catch(err){
   console.log(err);
   return res.send(Message("Unknown error occurred."));
 }
}