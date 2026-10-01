const express = require("express");

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, changePassword);
router.post("/profile", authMiddleware, updateProfile);

module.exports = router;