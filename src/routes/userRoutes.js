const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const upload = require("../middleware/multer");
const {
  getMe,
  updateMe,
  uploadProfilePicture
} = require("../controllers/userController");

router.get("/me", auth, getMe);
router.put("/me", auth, updateMe);
router.post(
    "/me/profile-picture",
    auth,
    upload.single("profilePicture"),
    uploadProfilePicture
  );  
module.exports = router;