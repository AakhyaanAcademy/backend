const express = require("express");
const Course = require("../model/course");

const authenticate = require("../middleware/authenticate");

const {
  createCourse,
  editCourse,
  deleteCourse,
  getCourses,
} = require("../controllers/course");

const {
  getSubjects,
  getSubjectWithChapters,
  getDetailedSubjects,
  createSubject,
  editSubject,
  deleteSubject,
} = require("../controllers/subject");

const {
  createChapter,
  editChapter,
  getChapters,
  deleteChapter,
  getChaptersWithTopics,
} = require("../controllers/chapter");

const {
  createTopic,
  getTopics,
  appendQuestionInTopic,
  editQuestionInTopic,
  deleteQuestionInTopic,
  getTopic,
  editTopic,
  deleteTopic,
} = require("../controllers/topic");

const router = express.Router();

//to get all the courses
router.get("/courses/list", authenticate, getCourses);
router.post("/course/create", authenticate, createCourse);
router.post("/course/edit", authenticate, editCourse);
router.post("/course/delete", authenticate, deleteCourse);

router.get("/subjects/:courseId/list", authenticate, getSubjects);
router.get("/subjects/:courseId/listwithdetail", authenticate, getDetailedSubjects);
router.get("/subjects/:courseId/listwithchapter", authenticate, getSubjectWithChapters);
router.post("/subject/create", authenticate, createSubject);
router.post("/subject/edit", authenticate, editSubject);
router.post("/subject/delete", authenticate, deleteSubject);

router.get("/chapters/:courseId/:subjectId/list", authenticate, getChapters);
// router.get("/chapters/:subjectId/list", authenticate, getChapters);
router.get("/chapters/:courseId/:subjectId/listwithtopic", authenticate, getChaptersWithTopics)
router.post("/chapter/create", authenticate, createChapter);
router.post("/chapter/edit", authenticate, editChapter);
router.post("/chapter/delete", authenticate, deleteChapter);

router.get("/topics/:chapterId/list", authenticate, getTopics);
router.get(
  "/topic/:courseId/:subjectId/:chapterId/:topicId",
  authenticate,
  getTopic
);
router.post("/topic/edit", authenticate, editTopic);
router.post("/topic/mcq/append", authenticate, appendQuestionInTopic);
router.post("/topic/mcq/edit", authenticate, editQuestionInTopic);
router.post("/topic/mcq/delete", authenticate, deleteQuestionInTopic);
router.post("/topic/delete", authenticate, deleteTopic);
router.post("/topic/create", authenticate, createTopic);

module.exports = router;
