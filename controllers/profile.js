const User = require("../model/user");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const PasswordToken = require("../model/passwordToken");
const { sendMail } = require("../controller/mail");

const { hasPermission } = require("../middleware/permission");

const {
  ppUploader,
} = require("../middleware/s3FileHandler");

const Message = require("../config/message");

exports.getNewToken = async(req, res) => {
  if(!req.user) return res.send(Message("User unauthenticated."));
  
  try{
    let currentUser = {
      email: req.user.email,
      id: req.user._id
    }
    const token = jwt.sign(currentUser, process.env.JWT_SECRET, { expiresIn: "240h" });

    let cookie = {
      httpOnly: true,
      secure: false
    }
    if (process.env.PRODUCTION_MODE === "true") {
      cookie = {
        ...cookie,
        secure: true,
        domain: process.env.COOKIE_DOMAIN,
        sameSite: 'none',
        maxAge: 864000000
      }
    }
    res.cookie('jwt', token, cookie).send(Message("", true))
    
  }catch(err){
    return res.send(Message("Unknown error occurred."));
  }
}


const getUserDetail = async (requestUser, currentUser, cb) => {
  if (!requestUser.id) return cb("User ID is required.", null);

  let user = {};
  try {
    user = await User.findOne({ id: requestUser.id }, {solvedMcq: 0});
    if (!user) return cb("User doesnot exist", null);

    let userData = {
      _id: user._id,
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      type: user.type,
      address: user.address,
      age: user.age,
      college: user.college,
      profilePicture: user.profilePicture ? `${process.env.PUBLIC_BUCKET_URL}/${user.profilePicture}` : null,
    };

    if (currentUser.id === user.id || hasPermission(req.user?.type, "ediUser")) {
      userData.email = user.email;
      userData.phone = user.phone;
      userData.isVerified = user.isVerified;
      userData.purchase = user.purchase;
      userData.paymentPicture = user.paymentPicture;
      userData.purchase = user.purchase;
    }

    return cb(null, userData);
  } catch (err) {
    return cb(err.message, null);
  }
};

exports.getUserProfile = async (req, res) => {
  const { user } = req;
  if (!user) return res.send(Message("Not logged in."));

  getUserDetail(req.user, req.user, (err, currentUser) => {
    if (err) return res.send(Message(err));
    return res.send(Message("", true, currentUser));
  });
};

//edit existing user
exports.editProfile = async (req, res) => {
  const { id: userId } = req.body;
  const body = req.body;
  if (!userId) return res.status(401).send("Invalid request");

  if (userId != req.user.id)
    return res.status(401).send(Message("Invalid request."));

  try {
    let currentUser = await User.findOne({ id: userId });
    if (!currentUser) return res.status(401).send(Message("No such user."));

    (currentUser.firstName = body.firstName),
      (currentUser.middleName = body.middleName ? body.middleName : null),
      (currentUser.lastName = body.lastName),
      (currentUser.phone = body.phone),
      (currentUser.age = body.age ? body.age : null),
      (currentUser.college = body.college ? body.college : null),
      (currentUser.type = currentUser.type),
      (currentUser.address = body.address ? body.address : null),
      await currentUser.save();
    return res.send(Message("User edited successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.getUserProfileWithId = async (req, res) => {
  const user = await getUserDetail(req.params, req.user);
  if (!user) return res.send(Message("Not logged in."));

  getUserDetail(req.user, req.user).then((err, currentUser) => {
    if (err) return res.send(Message(err));
    return res.send(Message("", true, currentUser));
  });
};

//edit existing user
exports.editUser = async (req, res) => {
  const { userId } = req.body;
  const body = req.body;
  if (!userId) return res.status(401).send("Invalid request");

  if (userId != req.user.id)
    return res.status(401).send(Message("Invalid request."));

  try {
    let currentUser = await User.findOne({ id: userId });
    if (!currentUser) return res.status(401).send(Message("No such user."));

    (currentUser.firstName = body.firstName),
      (currentUser.middleName = body.middleName ? body.middleName : null),
      (currentUser.lastName = body.lastName),
      (currentUser.phone = body.phone),
      (currentUser.type = "student"),
      (currentUser.address = body.address ? body.address : null),
      await currentUser.save();
    return res.send(Message("User edited successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

//Reset passowrd of requested user
exports.resetPassword = async (req, res) => {
  // const err = validationResult(req);
  //if (!err.isEmpty()) return res.send(err.mapped());

  const email = req.body.email;

  if(!email){
    return res.send(Message("Password Reset Email has been sent. It will be valid for a day.", true));
  }

  try {
    const user = await User.findOne({ email: email });
    if(!user){
      return res.send(Message("Password Reset Email has been sent. It will be valid for a day.", true));
    }
    //generate random token for password reset
    const tokenString = crypto.randomBytes(128).toString("hex");

    const token = new PasswordToken({
      user: user._id,
      value: tokenString,
    });

    //save token in database and send email to user
    const savedToken = await token.save();
    if (savedToken) {
      const mailOptions = {
        to: req.body.email,
        subject: "Reset Password",
        html: `<p>Follow the given link to reset password:</p>
                <a href="${process.env.FRONTEND_URL}/user/new-password/${token.value}">Reset Password</a>.
              <p>It will be valid for 24 hours.`,
      };
      await sendMail(mailOptions);
    }
  } catch (err) {
    console.log(err);
  }
  return res.send(Message("Password Reset Email has been sent. It will be valid for a day.", true));
};

//endpoint for changing user profile picture
exports.changePP = async (req, res) => {
  if (!req.user) return res.status(401).send(Message("Invalid User"));
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(401).send(Message("Invalid User."));

    let ppUrl = await ppUploader(req);
    
    if(!ppUrl.Key) return res.send(Message("Unknonwn error occurred."));
    
    currentUser.profilePicture =  ppUrl.Key
    await currentUser.save();
    
    return res.send(
      Message("PP changed succcessfully.", true, { ppUrl:  `${process.env.PUBLIC_BUCKET_URL}/${ppUrl.Key}`})
    );

  } catch (err) {
    console.log(err);
    if(err.known){
      return res.send(Message(err.message));
    }
    return res.send(Message("Unknown error occurred."));
  }
};

exports.newPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.send("error");
  try {
    const tokenData = await PasswordToken.findOne({ value: token });
    if (!tokenData) {
      return res.send(Message("Invalid token."));
    }
    try {
      const user = await User.findById(tokenData.user);
      if (!user) res.send(Message("No such user."));
      user.password = newPassword;
      await user.save();
      await tokenData.delete();
      return res.send(Message("Password Updated", true));
    } catch (err) {
      return res.send(Message(err.message));
    }
  } catch (err) {
    return res.send(Message(err.message));
  }
};
