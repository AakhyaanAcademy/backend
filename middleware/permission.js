exports.hasPermission = (userType, actionType, actionContent) => {
    if(!userType || !actionType) return false;
    if(userType === "superadmin") return true;

    let studentPermission = [
        "getMcq",
        "takeExam",
    ]
    
    if(userType === "student") {
        return studentPermission.includes(actionType);
    }
    
    let teacherPermission = [
        ...studentPermission,
        "getPrivateContent",
        "editMcq",
        "editChapter", "editTopic",
    ]
    if(userType === "teacher"){
        return teacherPermission.includes(actionType);
    }

    if(userType === "admin"){
        let adminPermission = [ 
            ...teacherPermission,
            "listFiles",
            "uploadFile", "deleteFile",
            "getPrivateContent", "editCourse",
            "createSubject", "editSubject",
            "createChapter", 
            "createTopic",  
            "deleteChapter", 
            "editProgram",
        ]

        return adminPermission.includes(actionType);
    };

    return false;
}