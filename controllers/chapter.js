const Course = require("../model/course");
const Chapter = require("../model/chapter");
const Topic = require("../model/topic");
const Subject = require("../model/subject");

const Message = require("../config/message");

const { hasPermission } = require("../middleware/permission");

exports.getChapters = async (req, res) => {
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  const { courseId, subjectId } = req.params;

  try {
    const currentCourse = await Course.findOne({ _id: courseId, published: { $in: [true, publishedType] } });
    if (!currentCourse) return res.status(404).send(Message("Subject not found"));

    const currentSubject = await Subject.findOne({ _id: subjectId, published: { $in: [true, publishedType] } });
    if (!currentSubject)
      return res.status(404).send(Message("Subject not found."));

    let chapterIds = currentSubject.chapter;
    const chapters = await Chapter.find(
      {
        _id: { $in: chapterIds },
        published: { $in: [true, publishedType] }
      },
      { _id: 1, title: 1, published: 1, sn: 1 }
    );
    return res.send(
      Message("", true, {
        chapters,
        subject: { _id: subjectId, title: currentSubject.title },
        course: { _id: courseId, title: currentCourse.title }
      })
    );
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.getChaptersWithTopics = async (req, res) => {
  const { subjectId, courseId } = req.params;
  let publishedType = !hasPermission(req.user?.type, "getPrivateContent");
  try {
    const currentCourse = await Course.findOne({ _id: courseId, published: { $in: [true, publishedType] } });
    if (!currentCourse) return res.status(404).send(Message("Subject not found"));

    const currentSubject = await Subject.findOne({ _id: subjectId, published: { $in: [true, publishedType] } });
    if (!currentSubject) return res.status(404).send(Message("Subject not found."));

    let chapters = [];

    for (let chapterId of currentSubject.chapter) {
      let chapter = await Chapter.aggregate([{
        $match: {
          "_id": chapterId,
          published: { $in: [true, publishedType] }
        }
      }, {
        $lookup: {
          from: 'topics',
          let: { topicId: "$topic" },
          pipeline: [{
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$topicId"] },
                  { $in: ["$published", [true, publishedType]] }
                ]
              },
            }
          }],
          as: 'topics'
        }
      }, {
        $project: { title: 1, sn: 1, "topics._id": 1, "topics.title": 1, "topics.sn": 1 }
      }])
      if (chapter[0]) chapters.push(chapter[0]);
    }

    return res.send(Message("", true, {
      chapters,
      subject: { _id: subjectId, title: currentSubject.title },
      course: { _id: courseId, title: currentCourse.title }
    }));
  } catch (err) {
    return res.send(err.messge);
  }
}

exports.createChapter = async (req, res) => {
  if (!hasPermission(req.user?.type, "createChapter"))
    return res.status(401).send(Message("User Unauthorized."));
  let { subjectId, title, sn } = req.body;
  title = title.trim();

  const currentSubject = await Subject.findOne({ _id: subjectId });
  if (!currentSubject) return res.send(Message("Subject doesn't exist."));

  let _id = `${title}`.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  while (true) {
    const duplicateChapter = await Chapter.findOne({ _id: _id });
    if (!duplicateChapter) break;
    _id = `${_id}${Math.floor(Math.random() * 10)}`;
  }

  try {
    const newChapter = new Chapter({
      _id: _id,
      title: title,
      sn: sn,
      topic: [],
    });

    const addChapter = await newChapter.save();
    await Subject.updateOne({ _id: subjectId }, { $push: { chapter: _id } });
    return res.send(Message("Chapter Created Successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.editChapter = async (req, res) => {
  if (!hasPermission(req.user?.type, "editChapter"))
    return res.status(401).send(Message("User Unauthorized."));
  const { chapterId, chapterTitle, sn, published } = req.body;

  try {
    //check if chapter exists
    const currentChapter = await Chapter.findOne({ _id: chapterId });
    if (!currentChapter) return res.send(Message("No Such Chapter."));

    //modify course title
    let newChapter = {
      sn: (typeof sn === undefined) ? currentChapter.sn : sn,
      title: (typeof chapterTitle === undefined) ? currentChapter.title : chapterTitle,
      published: (typeof published === undefined) ? currentChapter.published : published,
    }

    await Chapter.findOneAndUpdate({ _id: chapterId }, {
      $set: newChapter
    })

    return res.send(Message("Chapter Edited Successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};

exports.deleteChapter = async (req, res) => {
  if (!hasPermission(req.user?.type, "deleteChapter"))
    return res.status(401).send(Message("User Unauthorized."));
  const { chapterId, subjectId } = req.body;
  try {
    //check if chapter exists
    const currentChapter = await Chapter.findOne({ _id: chapterId });
    if (!currentChapter) return res.send(Message("No Such Chapter."));

    const topics = currentChapter.topic;
    if (topics) await Topic.deleteMany({ _id: { $in: topics } });

    await currentChapter.delete();
    await Subject.findOneAndUpdate(
      { _id: subjectId },
      { $pull: { chapter: chapterId } }
    );
    return res.send(Message("Chapter deleted Successfully.", true));
  } catch (err) {
    return res.send(Message(err.message));
  }
};
