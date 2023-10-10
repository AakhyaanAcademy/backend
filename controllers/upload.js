const multer = require("multer");

const fileUploader = require('../middleware/fileUpload');

module.exports = {
    uploadFiles: (req, res) => {
        const {user} = req;
        if(!user || user.type != 'admin' || user.type != 'superadmin') return res.status(401).send(Message("Unauthorized."));
        const upload = multer({
            storage: fileUploader.files.storage()
        }).single('files');

        upload(req, res, (err) => {
            if(err instanceof multer.MulterError) return res.status(401).send(Message("Upload Failed"));
            if(err) return res.send(err);
            return res.send(Message("Upload successful", true));
        })
    }
}