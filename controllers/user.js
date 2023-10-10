const jwt = require("jsonwebtoken");
const User = require("../model/user");
const crypto = require('crypto');
const Message = require("../config/message")
const { sendMail } = require("../controller/mail");
const EmailToken = require("../model/emailToken");

const isEmailValid = (email) => {
  const emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  if (!email)
    return false;

  if (email.length > 254)
    return false;

  const valid = emailRegex.test(email);
  if (!valid)
    return false;

  // Further checking of some things regex can't handle
  const parts = email.split("@");
  if (parts[0].length > 64)
    return false;

  const domainParts = parts[1].split(".");
  if (domainParts.some(function (part) { return part.length > 63; }))
    return false;

  return true;
}

//creating new user for /create endpoint
exports.createUser = async (req, res) => {
  const body = req.body;

  let { firstName, lastName, email, phone, password } = req.body;
  
  firstName = firstName.trim();
  lastName = lastName.trim();
  email = email.trim();
  
  if (!firstName || !lastName || !email || !phone || !password) return res.send(Message("Required fields missing."));
  
  if(phone.length !== 10) return res.send(Message("Phone number must have exactly 10 digits"));
  if(!isEmailValid(email)) return res.send(Message("Invalid email."));

  let id = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  while (true) {
    const duplicateUser = await User.findOne({ id: id });
    if (!duplicateUser) break;
    id = `${id}${Math.floor(Math.random() * 10)}`;
  }

  const userData = {
    id: id,
    firstName: firstName,
    middleName: body.middleName ? body.middleName : null,
    lastName: lastName,
    email: email.toLowerCase(),
    phone: phone,
    password: password,
    type: "student",
    address: body.address ? body.address : null,
    isVerified: false,
  };

  if (!req?.captcha?.data?.success) {
    return res.send(Message("Captcha Verification Failed."));
  }

  try {
    const emailExists = await User.findOne({ email: userData.email });
    if (emailExists) {
      return res.send(Message("Email already exists."));
    }
  } catch (err) {
    return res.status(400).send(Message("Unknown error occurred."));
  }

  const user = new User(userData);

  try {
    const savedUser = await user.save();

    //generate random token for email verification
    const tokenString = crypto.randomBytes(128).toString("hex");

    const emailToken = new EmailToken({
      value: tokenString,
      user: savedUser._id,
    });

    await emailToken.save();
    
    //send email verification mail to user
    const mailOptions = {
      to: userData.email,
      subject: "Verify our Email.",
      html: `<p>Follow the given link to verify your email:</p>
      <a href="${process.env.FRONTEND_URL}/verify-email/${tokenString}">Verify Email</>`,
    }
    
    await sendMail(mailOptions);
    return res.send(Message("User Created Successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

//controlling singin of existing user for /login endpoint
exports.loginUser = async (req, res) => {
  const data = req.body;
  try {
    if (!data.email || !data.password) {
      return res.send(Message("Email and password requied"));
    }

    const emailRegex = new RegExp(["^", data.email.toLowerCase(), "$"].join(""), "i");
    User.findOne({ email: emailRegex }, (err, user) => {
      if (err) res.send(err);

      if (!user || !data.password)
        return res.send(Message("Invalid email or password."));

      user.validatePassword(data.password, user.password, (err, matched) => {
        if (err)
          return res.send(Message("Error Encountered"));

        if (!matched)
          return res.send(Message("Invalid email or password."));

        const currentUser = {
          email: user.email,
          id: user._id,
        };
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
            maxAge: 8640000000
          }
        }
        res.cookie('jwt', token, cookie).send(Message("Logged in successfully.", true))

      });
    });
  } catch (err) {
    return res.send(Message("Unknonwn error occurred."));
  }

};

exports.logoutUser = async (req, res) => {
  if (req.cookies['jwt']) {
    let cookie = {
      httpOnly: true,
      secure: false
    }
    if (process.env.PRODUCTION_MODE === "true") {
      cookie = {
        ...cookie,
        secure: true,
        domain: process.env.COOKIE_DOMAIN,
        sameSite: 'none'
      }
    }
    res
      .clearCookie('jwt', cookie)
      .json(Message("Logged out successfully.", true))
  } else {
    res.send(Message("Invalid jwt."))
  }
}

//to send email verification link through gmail
exports.sendVerification = async (req, res) => {
  const { id } = req.user
  if (!id) return res.status(401).send(Message("Invalid request"));

  try {
    const user = await User.findOne({ id: id });
    if (user) {
      try {
        //generate random token for email verification
        const tokenString = crypto.randomBytes(128).toString('hex');

        const isEmailToken = await EmailToken.findOne({ user: user._id })
        let emailToken
        if (isEmailToken) {
          isEmailToken.value = tokenString
          await isEmailToken.save()
        } else {
          emailToken = new EmailToken({
            value: tokenString,
            user: user._id
          })
          await emailToken.save()
        }


        //send email verification mail to user
        const mailOptions = {
          to: user.email,
          subject: "Confirm Your Password.",
          html: `
          <p>Follow the given link to verify your email:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email/${tokenString}">Verify Email</>
          `,
        }

        await sendMail(mailOptions);
        return res.send(Message("An email verification link has been sent to your mail.", true));
      } catch (err) {
        return res.send(Message(err.message));
      }
    }

  } catch (err) {
    return res.send(Message(err.message));
  }
}

exports.verifyEmail = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.send(Message("Invalid or expired token."));
  try {
    const tokenData = await EmailToken.findOne({ value: token });
    if (!tokenData) {
      return res.send(Message("Invalid token."));
    }
    try {
      const user = await User.findById(tokenData.user)
      if (!user) res.send(Message("Invalid token."));

      if (user.isVerified) {
        return res.send(Message("User Already Verified."));
      }

      user.isVerified = true;
      await user.save();
      return res.send(Message("Email Verified Successfully.", true));
    } catch (err) {
      return res.send(Message(err.message));
    }
  } catch (err) {
    return res.send(Message(err.message));
  }
};
