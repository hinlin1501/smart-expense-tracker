const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

// ================================
// Helper functions
// ================================

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function isValidFullName(fullName) {
  return (
    typeof fullName === "string" &&
    fullName.trim().length > 0 &&
    fullName.trim().length <= 100
  );
}

function getJwtSecret() {
  return process.env.JWT_SECRET;
}

// ================================
// REGISTER
// ================================

const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Validate full name
    if (!isValidFullName(full_name)) {
      return res.status(400).json({
        message: "Full name is required and must not exceed 100 characters",
      });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Validate password
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain both letters and numbers",
      });
    }

    // Check duplicate email
    const existingUser = await prisma.users.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        full_name: full_name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
    });

    return res.status(201).json({
      message: "Registration successful",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);

    // Handle unique email constraint
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ================================
// LOGIN
// ================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Valid email and password are required",
      });
    }

    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Internal server error",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Find user
    const user = await prisma.users.findUnique({
      where: {
        email: normalizedEmail,
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
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

// ================================
// FORGOT PASSWORD
// ================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Valid email is required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.users.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    // Do not reveal whether the email exists
    const successMessage =
      "If the email exists, a password reset request has been created";

    if (!user) {
      return res.status(200).json({
        message: successMessage,
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Token expires after 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // Invalidate previous unused tokens
      await tx.password_reset_tokens.updateMany({
        where: {
          user_id: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Create new reset token
      await tx.password_reset_tokens.create({
        data: {
          user_id: user.id,
          token,
          expires_at: expiresAt,
        },
      });
    });

    /*
     * For the current project implementation, resetToken is returned
     * so the reset-password flow can be completed without an email service.
     *
     * In production, send the token through email instead of returning it
     * in the API response.
     */
    return res.status(200).json({
      message: successMessage,
      resetToken: token,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ================================
// RESET PASSWORD
// ================================

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (
      typeof token !== "string" ||
      !token.trim() ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain both letters and numbers",
      });
    }

    const resetToken = await prisma.password_reset_tokens.findUnique({
      where: {
        token: token.trim(),
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

    if (resetToken.expires_at.getTime() <= Date.now()) {
      return res.status(400).json({
        message: "Reset token has expired",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and consume token atomically
    await prisma.$transaction(async (tx) => {
      const tokenUpdate = await tx.password_reset_tokens.updateMany({
        where: {
          id: resetToken.id,
          used: false,
          expires_at: {
            gt: new Date(),
          },
        },
        data: {
          used: true,
        },
      });

      if (tokenUpdate.count === 0) {
        throw new Error("RESET_TOKEN_INVALID_OR_USED");
      }

      await tx.users.update({
        where: {
          id: resetToken.user_id,
        },
        data: {
          password_hash: passwordHash,
          updated_at: new Date(),
        },
      });
    });

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    if (error.message === "RESET_TOKEN_INVALID_OR_USED") {
      return res.status(400).json({
        message: "Invalid, expired or already used reset token",
      });
    }

    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ================================
// CHANGE PASSWORD
// ================================

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters and contain both letters and numbers",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        message: "Account is inactive",
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

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        password_hash: passwordHash,
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

// ================================
// UPDATE PROFILE
// ================================

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { full_name } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!isValidFullName(full_name)) {
      return res.status(400).json({
        message: "Full name is required and must not exceed 100 characters",
      });
    }

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        message: "Account is inactive",
      });
    }

    const updatedUser = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        full_name: full_name.trim(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
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
