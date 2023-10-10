const axios = require("axios");

module.exports = async (req, res, next) => {
  let captcha = req.body.captcha;
  let verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET_KEY}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;

  try{
    const response = await axios.get(verificationUrl);
    req.captcha = response;
    if(response.data.success === false){
      return res.send(Message("Invalid Captcha. Try refreshing the page and try again."));
    }
    next();
  }catch(err){
    return next("Captcha Error.")
  }
};
