const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
var cookieParser = require("cookie-parser");

dotenv.config();

const routes = require("./route/index");

let mongoURL = process.env.DB_URL;

mongoose.connect(mongoURL, {
  useNewURLParser: true,
  useUnifiedTopology: true,
});

let db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error"));
db.once("connection", () => {
  console.log("Database connected successfully");
});
const app = express();

app.use((req,res,next)=>{
  console.log(req.path)
  next()
})
//app.use(cors())
app.use(cookieParser());
app.use(express.static('public'));

app.use('/static', express.static(__dirname ));

app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({limit: '5mb'}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

app.get("/",(req,res)=> {
  res.send("Hello")
})

app.get("/abcd",(req,res)=>{
  console.log("test: abcd")
  res.send("hell test")
})

const allowlist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://beta.aakhyaan.org",
  "https://aakhyaan.org",
  "https://localhost.com",
  "https://admin.aakhyaan.org",
  "https://frontend-chi-ecru.vercel.app"
];

const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  //if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { 
        origin: req.header('Origin'),
        methods: ["GET", "POST"],
        credentials: true,
        SameSite: "none"
    }
   //} else {
     //corsOptions = { origin: false } 
   //}
  callback(null, corsOptions) 
}

app.use("/", cors(corsOptionsDelegate),  routes);

app.listen(process.env.PORT, () => {
  console.log(`Application started on port ${process.env.PORT}`);
});
