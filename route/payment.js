const express = require("express");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

const {
  uploadSS,
  verifySS,
  rejectSS,
  listPayment,
  getPayment,
} = require("../controllers/payment");

router.get("/list/:programId", authenticate, listPayment);
router.get("/get/:programId", authenticate, getPayment);
router.post("/verify", authenticate, verifySS);
router.post("/reject", authenticate, rejectSS);
router.post("/upload/:programId", authenticate, uploadSS);

module.exports = router;