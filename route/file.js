const express = require("express");
const Message = require("../config/message");
const {S3Client} = require("@aws-sdk/client-s3");

const { hasPermission } = require("../middleware/permission");

const s3 = new S3Client({
    endpoint: `https://${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: `${process.env.ACCESS_KEY_ID}`,
        secretAccessKey: `${process.env.ACCESS_KEY_SECRET}`,
    },
    signatureVersion: 'v4',
});

const authenticate = require("../middleware/authenticate");

const { 
  fileUploader,
  listFiles,
  deleteFile
} = require("../middleware/s3FileHandler");

const router = express.Router();

router.post("/upload", authenticate, async(req, res) => {
  if (!hasPermission(req.user?.type, "uploadFile")) return res.status(401).send(Message("User Unauthorized."));
  try{
    
    let fileInfo = await fileUploader(req);
    if (!fileInfo.Key) return res.send(Message("Error uploading file"));

    const fileUrl = `${process.env.PUBLIC_BUCKET_URL}/${fileInfo.Key}`;

    return res.send(
      Message("File uploaded succcessfully.", true, { fileUrl })
    );
  }catch(err){
    return res.send(Message(err.message));
  }
});

router.get("/list", authenticate, async (req, res) => {
  if (!hasPermission(req.user?.type, "listFiles")) return res.status(401).send(Message("User Unauthorized."));
  try{
    let data = await listFiles();
    return res.send(data);    
  }catch(err){
    console.log(err);
    return res.send(Message("Unknown error occurred."));
  }
})

router.post("/delete/", authenticate, async (req, res) => {
  if (!hasPermission(req.user?.type, "deleteFile")) return res.status(401).send(Message("User Unauthorized."));
  try{
    let {key} = req.body;
    let data = await deleteFile(key);
    return res.send(Message("File deleted successfully.", true, data));    
  }catch(err){
    console.log(err);
    return res.send(Message("Unknown error occurred."));
  }
})
module.exports = router;