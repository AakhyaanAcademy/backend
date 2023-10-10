const express = require("express");
const passport = require("passport");

const user = require("./user");
const course = require("./course");
const program = require("./program");
const upload = require("./file");
const mcq = require("./mcq");
const chapterMcq = require("./chapterMcq");
const payment = require("./payment");

require("../middleware/jwt")(passport);

const router = express.Router();

router.get("/test", (req, res) => {
    return res.sendFile("/home/anish/customers.csv");
})
router.use("/mcq", mcq);
router.use("/chaptermcq", chapterMcq);
router.use("/file", upload);

router.use("/payment", payment);
router.use("/user", user);
router.use("/program", program);
router.use("/", course);

module.exports = router;
