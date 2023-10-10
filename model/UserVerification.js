const mongoose = require("mongoose");

const UserVerificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  uniqueString: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  exppiresIn: {
    type: Date,
    required: true,
  },
});

const UserVerification = mongoose.model(
  "UserVerificarion",
  UserVerificationSchema
);

module.exports = UserVerification;
