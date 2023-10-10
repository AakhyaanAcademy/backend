const busboy = require('busboy');
const path = require("path");
const sharp = require("sharp");

const { Readable } = require('stream');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectCommand,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { Upload } = require("@aws-sdk/lib-storage");

const s3Obj = {
    region: 'auto',
    endpoint: `https://${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: `${process.env.ACCESS_KEY_ID}`,
        secretAccessKey: `${process.env.ACCESS_KEY_SECRET}`,
    },
    signatureVersion: 'v4',
};

const s3 = new S3Client(s3Obj);
const s3Private = new S3Client({
    ...s3Obj,
})


exports.ssUploader = (request, programId) => {
    return new Promise( (resolve, reject) => {
        const bb = busboy({ 
            headers: request.headers,
            limits: {
                files: 1,
                fileSize: 5*1024*1024
            }
        });
        
        bb.on('error', err => reject(err))
        
        bb.on('file', async (fieldName, file, fileInfo) => {
            
            file.on('limit', err => reject({message: "File must be less than 5MB", known: true}));
       
            if (
            fileInfo.mimeType != "image/png" &&
            fileInfo.mimeType != "image/jpg" &&
            fileInfo.mimeType != "image/jpeg"
            ) reject({message: "Unsupported file type.", known: true});
                
            let fileName = fileInfo.filename.substring(0, fileInfo.filename.lastIndexOf('.')) || fileInfo.filename;
            const extension = path.extname(fileInfo.filename);
            fileName =  `public/payment/${request.user.id}_${programId}${extension}`;
                
            const params = {
                Bucket: process.env.PRIVATE_BUCKET_NAME,
                Key: fileName,
                Body: file,
                ContentType: fileInfo.mimeType
            };
            
            let uploads = new Upload({ client: s3, params});
            resolve(await uploads.done());

        
        })
        request.pipe(bb)
    })
}

exports.ppUploader = (request) => {
    return new Promise( (resolve, reject) => {
        const bb = busboy({ 
            headers: request.headers,
            limits: {
                files: 1,
                fileSize: 5*1024*1024
            }
        });
        
        bb.on('error', err => reject(err))
        let fileStream = [];
        bb.on('file', async (fieldName, file, fileInfo) => {
            
            file.on('limit', err => reject({message: "File must be less than 5MB", known: true}));
            
            file.on('data', stream => fileStream.push(stream));

            file.on('end', async () => {
                let fileBuffer = await sharp(Buffer.concat(fileStream)).resize(200, 200).toBuffer();
                
                let fileName = fileInfo.filename.substring(0, fileInfo.filename.lastIndexOf('.')) || fileInfo.filename;
                const extension = path.extname(fileInfo.filename);
                fileName =  `public/user/${fileName}-${+Date.now()}-aakhyaan.org-${extension}`;
                
                const stream = Readable.from(fileBuffer);
                const params = {
                    Bucket: process.env.PUBLIC_BUCKET_NAME,
                    Key: fileName,
                    Body: fileBuffer,
                    ContentType: fileInfo.mimeType
                };
            
                let uploads = new Upload({ client: s3, params});
                resolve(await uploads.done());
            });

            if (
            fileInfo.mimeType != "image/png" &&
            fileInfo.mimeType != "image/jpg" &&
            fileInfo.mimeType != "image/jpeg"
            ) reject({message: "Unsupported file type.", known: true});
        
        })
        request.pipe(bb)
    })
}

exports.fileUploader = (request) => {
    return new Promise( (resolve, reject) => {
        const bb = busboy({ 
            headers: request.headers,
            limits: {
                files: 1,
                fileSize: 50*1024*1024
            }
        });
        
        bb.on('error', err => reject(err))
        
        bb.on('file', async (fieldName, file, fileInfo) => {
            
            file.on('limit', err => reject({message: "File must be less than 50MB", known: true}));
                
            let fileName = fileInfo.filename.substring(0, fileInfo.filename.lastIndexOf('.')) || fileInfo.filename;
            const extension = path.extname(fileInfo.filename);
            fileName =  `public/files/${fileName}-${+Date.now()}-aakhyaan_org${extension}`;
                
            const params = {
                Bucket: process.env.PUBLIC_BUCKET_NAME,
                Key: fileName,
                Body: file,
                ContentType: fileInfo.mimeType
            };
            
            let uploads = new Upload({ client: s3, params});
            resolve(await uploads.done());
        
        })
        request.pipe(bb)
    })
}

exports.listFiles = async() => {
    let params = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Prefix: "public/files"
    };
    let command = new ListObjectsV2Command(params);
    let data = await s3.send(command);
    let formattedData = [];
    for(let i=0; i<data?.Contents?.length; i++){
        formattedData.push({
            key: data.Contents[i].Key,
            fileURL: `${process.env.PUBLIC_BUCKET_URL}/${data.Contents[i].Key}`,
            time: data.Contents[i].LastModified.getTime(),
        })
    }
    return formattedData.sort((a, b) => a.time > b.time ? -1 : 1);
}

exports.deleteFile = async(key) => {
    let params = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Key: key
    };
    let command = new DeleteObjectCommand(params);
    let data = await s3.send(command);
    return data;
}



exports.listSS = async() => {
    let params = {
        Bucket: process.env.PUBLIC_BUCKET_NAME,
        Prefix: "public/payment"
    };
    let command = new ListObjectsV2Command(params);
    let data = await s3.send(command);
    let formattedData = [];
    for(let i=0; i<data?.Contents?.length; i++){
        formattedData.push({
            fileName: data.Contents[i].Key,
            fileUrl: `${process.env.PUBLIC_BUCKET_URL}/${data.Contents[i].Key}`,
            time: data.Contents[i].LastModified.getTime(),
        })
    }
    
    return formattedData.sort((a, b) => a.time > b.time ? -1 : 1);
}


exports.getSignedObjectUrl = async(key) => {
    if(!key) return false;
    try{
        const getObjectParams = { Bucket: process.env.PRIVATE_BUCKET_NAME, Key: key };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3Private, command, {expiresIn: 3600})
        return url;
    }catch(err){
        console.log(err);
        return false;
    }
}