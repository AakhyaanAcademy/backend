const express = require("express");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

const {
    listUser,
    editUser,
    deleteUser,
} = require('../controllers/manageUser');

router.get('/list', authenticate, listUser);
router.post('/edit', authenticate, editUser);
router.post('/delete', authenticate, deleteUser);
module.exports = router;
