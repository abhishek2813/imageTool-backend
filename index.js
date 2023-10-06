const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const ImageSchema = require("./models/ImageSchema");
const SavedImage = require("./models/SavedImage");
const UserSchema = require("./models/UserSchema");
require("dotenv").config();
const bcrypt = require("bcrypt");
const validator = require("validator");
// contact With MonoDb database
mongoose
  .connect(process.env.MONGOURL)
  .then((res) => console.log("mongodb contacted"));

// Variable
const PORT = Number(process.env.PORT) || 8001;
const SALT_ROUND = Number(process.env.SALT_ROUND) || 5;
const app = express();

//Middleware
app.use(cors(process.env.FRONTEND_URL));
app.use(express.json());
app.use(express.static("public"));

//Signup
app.post("/signup", async (req, resp) => {
  const { name, email, password } = req.body;

  // validations check
  if (!name || !email || !password) {
    return resp.status(400).send({ error: "All fields are required" });
  }
  if (validator.isEmpty(name)) {
    return resp.status(400).send({ error: "Name must contain only String" });
  }
  if (!validator.isEmail(email)) {
    return resp.status(400).send({ error: "Invalid email address" });
  }
  if (!validator.isLength(password, { min: 8 })) {
    return resp
      .status(400)
      .send({ error: "Password must be at least 8 characters long" });
  }

  //Chccek User Name or Email Already Exits
  const exitEmail = await UserSchema.findOne({ email: email });
  if (exitEmail) {
    return resp.status(400).send({ error: "Email Already Exits" });
  }

  //hasing password
  const hashPassword = await bcrypt.hash(password, SALT_ROUND);

  const newObj = {
    name,
    email,
    password: hashPassword,
  };
  const user = new UserSchema(newObj);
  try {
    const saveUser = await user.save();
    resp
      .status(201)
      .send({ status: 201, message: "User Register Successfully" });
  } catch (error) {
    resp
      .status(500)
      .send({ error: "An error occurred while registering the user" });
  }
});

//Login
app.post("/login", async (req, resp) => {
  const { email, password } = req.body;
  // validations check
  if (!email || !password) {
    return resp.status(400).send({ error: "All fields are required" });
  }
  if (validator.isEmpty(password)) {
    return resp.status(400).send({ error: "password is Empty" });
  }
  if (!validator.isEmail(email)) {
    return resp.status(400).send({ error: "Invalid email address" });
  }
  const userDetails = await UserSchema.findOne({ email: email });
  // console.log(userDetails);
  if (userDetails) {
    const isMatch = await bcrypt.compare(password, userDetails.password);
    //if not matched return
    if (!isMatch) {
      return resp.status(500).send({ error: "Wrong Password" });
    }
    const userData = {
      id: userDetails._id,
      name: userDetails.name,
      email: userDetails.email,
    };
    return resp
      .status(201)
      .send({ status: 201, message: "Login success", data: userData });
  } else {
    return resp
      .status(400)
      .send({ error: "User Not Found, Please register first" });
  }
});

// for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/Images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadImg = multer({
  storage: storage,
});

//Upload File
app.post("/upload", uploadImg.single("file"), (req, res) => {
  ImageSchema.create({ image: req.file.filename, userId: req.body.userId })
    .then((data) =>
      res.status(201).send({ status: 201, message: "Insert Success" })
    )
    .catch((err) =>
      res.status(400).send({ error: "All fields are required ,err" })
    );
});

// for image save
const savedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/Images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadSavedImg = multer({
  storage: savedStorage,
});

//Saved Upload File
app.post("/saved", uploadSavedImg.single("file"), (req, res) => {
  SavedImage.create({ image: req.file.filename, userId: req.body.userId })
    .then((data) => res.status(201).send({ status: 201, message: "Saved" }))
    .catch((err) =>
      res.status(400).send({ error: "All fields are required ,err" })
    );
});

// Get the uploaded Images
app.get("/upload/:userId", async (req, resp) => {
  const userId = req.params.userId;
  // console.log(userId);
  try {
    const result = await ImageSchema.find({ userId });
    resp.status(201).send({
      status: 201,
      message: "Images fetched successfully",
      data: result,
    });
  } catch (error) {
    resp
      .status(500)
      .send({ error: "An error occurred while Fetching the images" });
  }
});

//get saved image
app.get("/saved/:userId", async (req, resp) => {
  const userId = req.params.userId;
  // console.log(userId);
  try {
    const result = await SavedImage.find({ userId });
    resp.status(201).send({
      status: 201,
      message: "Images fetched successfully",
      data: result,
    });
  } catch (error) {
    resp
      .status(500)
      .send({ error: "An error occurred while Fetching the Saved images" });
  }
});

app.listen(PORT, () => {
  console.log("server is running on port", PORT);
});
