const { check, validationResult } = require("express-validator");

exports.validateUserSignUp = [
  check("firstName")
    .trim()
    .not()
    .isEmpty()
    .withMessage("First name is empty")
    .isString()
    .withMessage("Must be a string")
    .isLength({ min: 4, max: 20 })
    .withMessage("First name must be 4 to 20 characters long!"),

  check("middleName")
    .trim()
    .isString()
    .withMessage("Must be a string")
    .isLength({ min: 2, max: 20 })
    .withMessage("Middle name must be 2 to 20 characters long!"),

  check("lastName")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Last name is empty")
    .isString()
    .withMessage("Must be a string")
    .isLength({ min: 4, max: 20 })
    .withMessage("Last name must be 4 to 20 characters long!"),

  check("email").normalizeEmail().isEmail().withMessage("Enter a valid email"),

  check("phone")
    .isEmpty()
    .withMessage("Phone is must!!")
    .isNumeric()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number ")
    .isLength({ min: 10, max: 10 })
    .withMessage("Please enter a valid phone number"),

  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is empty")
    .isLength({ min: 6, max: 15 })
    .withMessage("Password must be 6 to 15 characters long!"),
];

exports.userValidation = (req, res, next) => {
  const result = validationResult(req).array();

  if (!result.length) return next();

  const err = result[0].msg;

  res.json(Message(err.message));
};

exports.validateUserSignIn = [
  check("email").normalizeEmail().isEmail().withMessage("Enter valid email"),
  check("password").trim().not().isEmpty().withMessage("Password is required"),
];

exports.validatePasswordReset = [
  check("email").normalizeEmail().isEmail().withMessage("Enter valid email."),
]