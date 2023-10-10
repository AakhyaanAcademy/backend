const express = require("express");

const authenticate = require("../middleware/authenticate");
const router = express.Router();

const {
  getChapterMcq,
  listChapterMcq,
  createChapterMcq,
  enableChapterMcq,
  deleteChapterMcq,
  editChapterMcq,
  appendQuestion,
  editQuestion,
  deleteQuestion,
  // listMcqByCourse,
} = require("../controllers/chapterMcq");

const {
  getSubmissions,
  getSubmissionsByChapter,
  getSubmission,
  submitMcq,
  preCheckMcq,
  startMcq,
  saveMcq,
} = require("../controllers/userChapterMcq");

const {
  getUsersSubmissions,
  importCSV,
} = require("../controllers/adminChapterMcq");

router.post("/create", authenticate, createChapterMcq);
router.get("/:chapterId/list", authenticate, listChapterMcq);
// router.get("/:courseId/list", authenticate, listMcqByCourse);
router.get("/get/:mcqId", authenticate, getChapterMcq);
router.post("/delete", authenticate, deleteChapterMcq);
router.post("/enable", authenticate, enableChapterMcq);
router.post("/edit", authenticate, editChapterMcq);
router.post("/question/append", authenticate, appendQuestion);
router.post("/question/edit", authenticate, editQuestion);
router.post("/question/delete", authenticate, deleteQuestion);


router.get("/submissions/", authenticate, getSubmissions);
router.get("/submissions/:chapterId", authenticate, getSubmissionsByChapter);
router.get("/submission/:submissionId", authenticate, getSubmission);
router.post("/precheck", authenticate, preCheckMcq);
router.post("/start", authenticate, startMcq);
router.post("/save", authenticate, saveMcq);
router.post("/submit", authenticate, submitMcq);


router.get("/users/submissions/:mcqId", authenticate, getUsersSubmissions);
router.post("/import/csv/:mcqId", authenticate, importCSV);

module.exports = router;
