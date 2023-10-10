const Course = require("../model/course");
const Message = require("../config/message");

const { hasPermission } = require("../middleware/permission");
const Subject = require("../model/subject");
const Topic = require("../model/topic");
const Chapter = require("../model/chapter");

exports.getSubjects = async (req, res) => {
  const { courseId } = req.params;
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  try {
    let currentCourse = await Course.findOne({
      _id: courseId,
      published: { $in: [true, publishedType] },
    });
    if (!currentCourse)
      return res.status(404).send(Message("Subject not found"));

    let subjects = await Subject.find(
      {
        _id: { $in: currentCourse.subject },
        published: { $in: [true, publishedType] },
      },
      { _id: 1, title: 1, published: 1, thumbnail: 1 }
    );

    return res.send(
      Message("", true, {
        subjects,
        course: { courseId, title: currentCourse.title },
      })
    );
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.getSubjectWithChapters = async (req, res) => {
  const { courseId } = req.params;
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  try {
    const currentCourse = await Course.findOne({
      _id: courseId,
      published: { $in: [true, publishedType] },
    });
    if (!currentCourse)
      return res.status(404).send(Message("Subject not found"));

    let subjects = await Subject.aggregate([
      {
        $match: {
          _id: { $in: currentCourse.subject },
          published: { $in: [true, publishedType] },
        },
      },
      {
        $lookup: {
          from: "chapters",
          let: { chapterId: "$chapter" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$chapterId"] },
                    { $in: ["$published", [true, publishedType]] },
                  ],
                },
              },
            },
          ],
          as: "chapters",
        },
      },
      {
        $project: {
          title: 1,
          sn: 1,
          "chapters._id": 1,
          "chapters.title": 1,
          "chapters.sn": 1,
        },
      },
    ]);

    return res.send(
      Message("", true, {
        subjects,
        course: { _id: courseId, title: currentCourse.title },
      })
    );
  } catch (err) {
    return res.send(err.messge);
  }
};

exports.getDetailedSubjects = async (req, res) => {
  const { courseId } = req.params;
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  try {
    let currentCourse = await Course.findOne({
      _id: courseId,
      published: { $in: [true, publishedType] },
    });
    if (!currentCourse)
      return res.status(404).send(Message("Subject not found"));

    let subjectsList = await Subject.find({
      _id: { $in: currentCourse.subject },
      published: { $in: [true, publishedType] },
    });
    let subjects = [];
    for (let subject of subjectsList) {
      let firstChapter = subject?.chapter
        ? await Chapter.findOne(
            {
              _id: { $in: subject.chapter },
              sn: 1,
              published: { $in: [true, publishedType] },
            },
            { topic: 1 }
          )
        : null;
      let firstTopic = firstChapter?.topic
        ? await Topic.findOne(
            {
              _id: { $in: firstChapter.topic },
              sn: 1,
              published: { $in: [true, publishedType] },
            },
            { _id: 1 }
          )
        : null;
      subjects.push({
        ...subject._doc,
        firstChapter: firstChapter ? firstChapter._id : null,
        firstTopic: firstTopic ? firstTopic._id : null,
      });
    }
    return res.send(
      Message("", true, {
        subjects,
        course: { title: currentCourse.title, courseId: currentCourse._id },
      })
    );
  } catch (err) {
    return res.send(err.messge);
  }
};

exports.getSubjects = async (req, res) => {
  const { courseId } = req.params;
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  try {
    let currentCourse = await Course.findOne({
      _id: courseId,
      published: { $in: [true, publishedType] },
    });
    if (!currentCourse)
      return res.status(404).send(Message("Subject not found"));

    let subjects = await Subject.find(
      {
        _id: { $in: currentCourse.subject },
        published: { $in: [true, publishedType] },
      },
      { _id: 1, title: 1, published: 1, thumbnail: 1 }
    );

    return res.send(
      Message("", true, {
        subjects,
        course: { courseId, title: currentCourse.title },
      })
    );
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.createSubject = async (req, res) => {
  if (!hasPermission(req.user?.type, "createSubject"))
    return res.status(401).send(Message("User Unauthorized."));
  let { courseId, title } = req.body;
  title = title.trim();

  const currentCourse = await Course.findOne({ _id: courseId });
  if (!currentCourse)
    return res.status(400).send(Message("Course doesn't exist."));

  let _id = `${title}`.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  while (true) {
    const duplicateSubject = await Subject.findOne({ _id: _id });
    if (!duplicateSubject) break;
    _id = `${_id}${Math.floor(Math.random() * 10)}`;
  }

  try {
    const newSubject = new Subject({
      _id: _id,
      title: title,
      topic: [],
    });

    await newSubject.save();
    await Course.updateOne({ _id: courseId }, { $push: { subject: _id } });
    return res.send(Message("Subject created successfully.", true));
  } catch (err) {
    return res.status(400).send(Message(err.message));
  }
};

exports.editSubject = async (req, res) => {
  if (!hasPermission(req.user?.type, "editSubject"))
    return res.status(401).send(Message("User Unauthorized."));

  const { subjectId, subjectTitle, published, thumbnail } = req.body;
  try {
    const currentSubject = await Subject.findById(subjectId);
    if (!currentSubject) return res.send(Message("No such Subject."));

    currentSubject.title = subjectTitle;
    if (typeof published != "undefined") currentSubject.published = published;
    if (typeof thumbnail != "undefined") currentSubject.thumbnail = thumbnail;
    await currentSubject.save();

    return res.send(Message("Subject Saved Successfully", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.deleteSubject = async (req, res) => {
  if (!hasPermission(req.user?.type, "deleteSubject"))
    return res.status(401).send(Message("User Unauthorized."));
  const { courseId, subjectId } = req.body;

  const currentCourse = await Course.findOne({ _id: courseId });
  if (!currentCourse)
    return res
      .status(400)
      .send(Message("Subject doesn't belong to any course."));

  try {
    const currentSubject = await Subject.findById(subjectId);
    if (!currentSubject)
      return res.status(400).send(Message("Subject doesn't exist."));

    const chapterIds = currentSubject.chapter;

    let topics = [];
    const chapters = await Chapter.find({ _id: { $in: chapterIds } });

    chapters.forEach((chapter) => {
      topics = [...topics, ...chapter.topic];
    });

    await currentSubject.delete();
    await Chapter.deleteMany({ _id: { $in: chapterIds } });
    await Topic.deleteMany({ _id: { $in: topics } });

    await Course.updateOne(
      { _id: courseId },
      { $pull: { subject: subjectId } }
    );

    return res.send(Message("Subject deleted successfully.", true));
  } catch (err) {
    return res.status(400).send(Message(err.message));
  }
};
