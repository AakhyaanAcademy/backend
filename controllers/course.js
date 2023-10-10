const Message = require("../config/message");
const Course = require("../model/course");

const { hasPermission } = require("../middleware/permission");
const Subject = require("../model/subject");
const Chapter = require("../model/chapter");
const Topic = require("../model/topic");

exports.getCourses = async (req, res) => {
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  
  try {
    const course = await Course.find({published: { $in: [true, publishedType]}});
    res.send(Message("", true, course));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.createCourse = async (req, res) => {
  if (!hasPermission(req.user?.type, "createCourse")) return res.status(401).send(Message("User Unauthorized."));
  let { title, thumbnail} = req.body;
  title = title.trim();
  if (!title) return res.send(Message("Title is required"));
  let _id = `${title}`.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  while (true) {
    const duplicateCourse = await Course.findOne({ _id: _id });
    if (!duplicateCourse) break;
    _id = `${_id}${Math.floor(Math.random() * 10)}`;
  }

  try {
    const newCourse = new Course({
      _id,
      title,
      published: false,
      thumbnail: thumbnail,
      subject: [],
    });

    await newCourse.save();
    return res.send(Message("Course created successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.mesasge));
  }
};

exports.editCourse = async (req, res) => {
  if (!hasPermission(req.user?.type, "editCourse"))
    return res.status(401).send(Message("User Unauthorized."));
  const { courseId,  courseTitle, published, thumbnail } = req.body;

  try {
    const currentCourse = await Course.findById(courseId);
    if (!currentCourse) return res.status(400).send(Message("No such course"));

    currentCourse.title = courseTitle;
    if (typeof thumbnail != "undefined") currentCourse.thumbnail = thumbnail;
    if (typeof published != "undefined") currentCourse.published = published;

    await currentCourse.save();
    return res.send(Message("Course edited successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.message));
  }
};



exports.deleteCourse = async (req, res) => {
  if (!hasPermission(req.user?.type, "deleteCourse"))
    return res.status(401).send(Message("User Unauthorized."));
  const { courseId } = req.body;
  if (!courseId) return res.status(400).send(Message("Invalid Course Id."));

  try {
    const currentCourse = await Course.findOne({ id: courseId });
    if (!currentCourse) return res.status(400).send(Message("No such course"));

    const subjectIds = currentCourse.subject;
    let subjects = await Subject.find({ _id: { $in: subjectIds } });

    let chapterIds = [];

    subjects.forEach((subject) => {
      chapterIds = [...chapterIds, ...subject.chapter];
    });

    let topicIds = [];
    const chapters = await Chapter.find({ _id: { $in: chapterIds } });

    chapters.forEach((chapter) => {
      topicIds = [...topicIds, ...chapter.topic];
    });

    await currentCourse.delete();
    await Subject.deleteMany({ _id: { $in: subjectIds } });
    await Chapter.deleteMany({ _id: { $in: chapterIds } });
    await Topic.deleteMany({ _id: { $in: topicIds } });

    return res.send(Message("Course deleted successfully", true));
  } catch (err) {
    return res.status(400).send(Message(err.message));
  }
};
