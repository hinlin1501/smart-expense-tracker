const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "Full name, email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Password must contain at least 8 characters,
    // including at least one letter and one number
    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain both letters and numbers",
      });
    }

    // Check duplicate email
    const existingUser = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        full_name,
        email,
        password_hash,
      },
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (user.is_active === false) {
      return res.status(403).json({
        message: "Account is inactive",
      });
    }

    // Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Create JWT access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    // Do not reveal whether the email exists
    if (!user) {
      return res.status(200).json({
        message:
          "If the email exists, a password reset request has been created",
      });
    }

    // Invalidate previous unused reset tokens
    await prisma.password_reset_tokens.updateMany({
      where: {
        user_id: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Token expires after 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.password_reset_tokens.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      },
    });

    return res.status(200).json({
      message: "Password reset request created",
      resetToken: token,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    // Validate new password
    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain both letters and numbers",
      });
    }

    const resetToken = await prisma.password_reset_tokens.findUnique({
      where: {
        token,
      },
    });

    if (!resetToken) {
      return res.status(400).json({
        message: "Invalid reset token",
      });
    }

    if (resetToken.used) {
      return res.status(400).json({
        message: "Reset token has already been used",
      });
    }

    if (new Date() > resetToken.expires_at) {
      return res.status(400).json({
        message: "Reset token has expired",
      });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: {
        id: resetToken.user_id,
      },
      data: {
        password_hash,
        updated_at: new Date(),
      },
    });

    // Mark token as used
    await prisma.password_reset_tokens.update({
      where: {
        id: resetToken.id,
      },
      data: {
        used: true,
      },
    });

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters and contain both letters and numbers",
      });
    }

    const user = await prisma.users.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        password_hash,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, email } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({
        message: "Full name and email are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const user = await prisma.users.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (existingUser && existingUser.id !== user.id) {
      return res.status(409).json({
        message: "Email is already in use",
      });
    }

    const updatedUser = await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        full_name,
        email,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
};