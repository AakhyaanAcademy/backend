const Message = require("../config/message");
const Program = require("../model/program");
const User = require("../model/user");

const { hasPermission } = require("../middleware/permission");

exports.getPrograms = async (req, res) => {
  let activeType = !hasPermission(req.user?.type, "getPrivateContent");
  // let adminPerm = hasPermission(req.user?.type, "editUser") ? 1 : 0;
  try {
    // let program;
    // if(adminPerm){
    const program = await Program.find({isValid: { $in: [true, activeType]}}, {paymentPicture: 0});
    // }
    // else{
    //   program = await Program.find({isValid: { $in: [true, activeType]}}, {users: adminPerm, isValid: 0});
    // }
    res.send(Message("", true, program));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.getProgram = async (req, res) => {
  let activeType = !hasPermission(req.user?.type, "getPrivateContent");
  // let activeType = true;
  const {programId} = req.params;
  try {
    let program = await Program.findOne({_id: programId, isValid: { $in: [true, activeType]}}, {paymentPicture: 0});
    res.send(Message("", true, program));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.getUsers = async (req, res) => {
  if (!hasPermission(req.user?.type, "editUser")) return res.status(401).send(Message("User Unauthorized."));
  const { programId } = req.params;
  try {
    const program = await Program.findOne({_id: programId});
    if(!program) return res.send(Message("Program not found."));

    let users = await User.find({_id: {$in: program.users}}, {id: 1, firstName: 1, lastName: 1, email: 1, phone: 1, isVerified: 1})
    res.send(Message("", true, users));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.createProgram = async (req, res) => {
  if (!hasPermission(req.user?.type, "createProgram")) return res.status(401).send(Message("User Unauthorized."));
  const { title, thumbnail, price, description, courseId } = req.body;
  if (!title) return res.send(Message("Title is required"));
  let _id = `${title}`.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  while (true) {
    const duplicateProgram = await Program.findOne({ _id: _id });
    if (!duplicateProgram) break;
    _id = `${_id}${Math.floor(Math.random() * 10)}`;
  }

  try {
    const newProgram = new Program({
      _id,
      title,
      thumbnail,
      isValid: false,
      price,
      users: [],
      description,
      courseId,
    });

    await newProgram.save();
    return res.send(Message("Program created successfully", true));
  } catch (err) {
    console.log(err);
    return res.status(400).send(Message(err.mesasge));
  }
};

exports.editProgram = async (req, res) => {
  if (!hasPermission(req.user?.type, "editProgram"))
    return res.status(401).send(Message("User Unauthorized."));
  const { programId, programTitle, courseId, isValid, thumbnail, price, description } = req.body;

  try {
    const currentProgram = await Program.findById(programId);
    if (!currentProgram) return res.status(400).send(Message("No such program"));

    currentProgram.title = programTitle;
    currentProgram.thumbnail = thumbnail;
    currentProgram.price = price;
    currentProgram.isValid = isValid;
    currentProgram.description = description;
    currentProgram.courseId = courseId;

    await currentProgram.save();
    return res.send(Message("Program edited successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.message));
  }
};

exports.deleteProgram = async (req, res) => {
  if (!hasPermission(req.user?.type, "deleteProgram")) return res.status(401).send(Message("User Unauthorized."));
  const { programId } = req.body;
  if (!programId) return res.status(400).send(Message("Invalid Program Id."));

  try {
    await Program.findOneAndDelete({ _id: programId });
    
    return res.send(Message("Program deleted successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.message));
  }
};
