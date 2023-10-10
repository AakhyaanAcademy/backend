const User = require("../model/user");
const Message = require("../config/message")
const { hasPermission } = require("../middleware/permission");

exports.listUser = async (req, res) => {
    if (!hasPermission(req.user?.type, "manageUser")) return res.status(401).send(Message("User Unauthorized."));
    try {
        const users = await User.find({}, {
            id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            isVerified: 1,
            address: 1,
            profilePicture: 1,
            type: 1,
            age: 1,
            college: 1, 
            programs: 1,
            createdAt: 1
        })
        return res.send(Message("", true, users));
    }catch(err){
        console.log(err);
        return res.status(400).send(Message("Unknown error occurred"))
    }
}

exports.editUser = async (req, res) => {
    if (!hasPermission(req.user?.type, "manageUser")) return res.status(401).send(Message("User Unauthorized."));
    const { userId } = req.body;
    try {
        const user = await User.findOneAndDelete({ _id: userId });
        if (user) {
            return res.send(Message("User deleted Succesfully.", true));
        } else {
            return res.send(Message("User not found."));
        }
    } catch (err) {
        console.log(err);
        return res.status(400).send(Message("Unknown error occurred"))
    }
}

exports.deleteUser = async (req, res) => {
    if (!hasPermission(req.user?.type, "manageUser")) return res.status(401).send(Message("User Unauthorized."));
    const { userId } = req.body;
    try {
        const user = await User.findOneAndDelete({ _id: userId });
        if (user) {
            return res.send(Message("User deleted Succesfully.", true));
        } else {
            return res.send(Message("User not found."));
        }
    } catch (err) {
        console.log(err);
        return res.status(400).send(Message("Unknown error occurred"))
    }
}