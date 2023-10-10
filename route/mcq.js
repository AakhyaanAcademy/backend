const express = require("express");

const authenticate = require("../middleware/authenticate");
const router = express.Router();

const {
  getMcq,
  listMcqs,
  createMcq,
  enableMcq,
  deleteMcq,
  editMcq,
  appendQuestion,
  editQuestion,
  deleteQuestion,
  listMcqByCourse,
} = require("../controllers/mcq");

const {
  getSubmissions,
  getSubmission,
  getSubmissionsByCourse,
  submitMcq,
  preCheckMcq,
  startMcq,
  saveMcq,
} = require("../controllers/userMcq");

const {
  getUsersSubmissions,
  importCSV,
} = require("../controllers/adminMcq");

router.post("/create", authenticate, createMcq);
router.get("/list", authenticate, listMcqs);
router.get("/:courseId/list", authenticate, listMcqByCourse);
router.get("/get/:mcqId", authenticate, getMcq);
router.post("/delete", authenticate, deleteMcq);
router.post("/enable", authenticate, enableMcq);
router.post("/edit", authenticate, editMcq);
router.post("/question/append", authenticate, appendQuestion);
router.post("/question/edit", authenticate, editQuestion);
router.post("/question/delete", authenticate, deleteQuestion);

router.get("/submission/course/:courseId", authenticate, getSubmissionsByCourse);
router.get("/submissions/", authenticate, getSubmissions);
router.get("/submission/:submissionId", authenticate, getSubmission);
router.post("/precheck", authenticate, preCheckMcq);
router.post("/start", authenticate, startMcq);
router.post("/save", authenticate, saveMcq);
router.post("/submit", authenticate, submitMcq);


router.get("/users/submissions/:mcqId", authenticate, getUsersSubmissions);
router.post("/import/csv/:mcqId", authenticate, importCSV);

module.exports = router;
