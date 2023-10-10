const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

var ObjectId = require("mongodb").ObjectId;

const SALT_FACTOR = 10;

const UserSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    profilePicture: {
      type: String,
      default: null,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      default: "student",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      required: false,
    },
    age: {
      type: Number,
    },
    college: {
      type: String,
    },
    programs: [{
      programId: {
        type: String,
        required: true,
      },
      programName: {
        type: String,
        required: true,
      },
    }],
    solvedMcq: [
      {
        mcqId: {
          type: String,
          required: true,
        },
        mcqTitle: {
          type: String,
          required: true,
        },
        startTime: {
          type: Number,
          require: true,
        },
        endTime: {
          type: Number,
          required: true,
        },
        answers: [Number],
      },
    ],
    solvedChapterMcq: [
      {
        mcqId: {
          type: String,
          required: true,
        },
        mcqTitle: {
          type: String,
          required: true,
        },
        chapterId: {
          type: String,
          required: false,
        },
        startTime: {
          type: Number,
          require: true,
        },
        endTime: {
          type: Number,
          required: true,
        },
        answers: [Number],
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
    },
  }
);

//pre save hook
UserSchema.pre("save", async function (next, doc) {
  if (!this.isModified("password")) return next();

  //if password is changed or user is new, encrypt the password
  try {
    const salt = await bcrypt.genSalt(SALT_FACTOR);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    return next(err);
  }

  if (!this.isNew) return next();

  //generate unique username from given id
  //replace special characters with "-"
  let id = `${this.id}`.replace(/[^a-zA-Z0-9]/g, "");

  //append random integer of 3 digits until unique username is found
  while (true) {
    const duplicateUser = await User.findOne({ id: id });
    if (!duplicateUser) break;
    id = `${id}${Math.floor(Math.random() * 1000)}`;
  }

  this.id = id;
  return next();
});


UserSchema.methods.validatePassword = async (password, hash, callback) => {
  //hash the given password with saved hash and verify user login
  bcrypt.compare(password, hash, async (err, result) => {
    if (err) callback(err);
    callback(null, result);
  });
};

const User = mongoose.model("User", UserSchema);

// Validate for duplicate user email
// UserSchema.path('email').validate( async (value) => {
//     const emailCount = await User.countDocuments({email: value});
//     return !emailCount;
// }, "Email already exists");

User.createIndexes();

module.exports = User;
