const express = require("express");

const authenticate = require("../middleware/authenticate");
const captcha = require("../middleware/captcha");
const {
  createUser,
  verifyEmail,
  loginUser,
  logoutUser,
  sendVerification,
} = require("../controllers/user");

const {
  validateUserSignUp,
  validateUserSignIn,
  validatePasswordReset,
} = require("../middleware/validators/user");

const {
  getUserProfile,
  editProfile,
  getUserProfileWithId,
  editUser,
  resetPassword,
  changePP,
  newPassword,
  getNewToken
} = require("../controllers/profile");

const manageUser = require("./manageUser");
const router = express.Router();

// router.get("/", async (req, res) => {
//   const user = await User.find({});
//   res.send(user);
// });

router.use('/manage', manageUser);
router.post("/create", validateUserSignUp, captcha, createUser);
router.post("/login", validateUserSignIn, loginUser);
router.post("/logout", logoutUser);

router.post("/edit", authenticate, editUser);

router.post("/password-reset", validatePasswordReset, resetPassword);
router.post("/new-password", newPassword);

router.get("/profile", authenticate, getUserProfile);
router.post("/profile", authenticate, editProfile);
router.get("/profile/:id", authenticate, getUserProfileWithId);
router.post("/changepp", authenticate, changePP);

router.post("/verify-email/", verifyEmail); //verify the token and email sent for email verification
router.get("/email/verify", authenticate, sendVerification);

router.get("/login/refresh", authenticate, getNewToken);
module.exports = router;
