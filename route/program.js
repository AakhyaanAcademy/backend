const express = require("express");

const authenticate = require("../middleware/authenticate");

const {
  createProgram,
  editProgram,
  deleteProgram,
  getPrograms,
  getProgram,
  getUsers,
} = require("../controllers/program");

const router = express.Router();

//to get all the programs
router.get("/list", authenticate, getPrograms);
router.get("/:programId/detail", authenticate, getProgram);
router.get("/:programId/users", authenticate, getUsers);
router.post("/create", authenticate, createProgram);
router.post("/edit", authenticate, editProgram);
router.post("/delete", authenticate, deleteProgram);

module.exports = router;
