
const express = require("express");
const router = express.Router();

const {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetUsage,
  getBudgets,
} = require("../controllers/budget.controller");

const authMiddleware = require("../middleware/auth.middleware");

// Tất cả API ngân sách đều yêu cầu đăng nhập
router.use(authMiddleware);

// US-25: Tạo ngân sách
router.post("/", createBudget);

// US-26: Cập nhật ngân sách
router.put("/:id", updateBudget);

// US-27: Xóa ngân sách
router.delete("/:id", deleteBudget);

// US-28: Xem mức sử dụng ngân sách
router.get("/:id/usage", getBudgetUsage);

// Liệt kê ngân sách của người dùng
router.get("/", getBudgets);

module.exports = router;
