const express = require("express");

const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require("../controllers/expense.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// US-17 + US-20
router.get("/", authMiddleware, getExpenses);

// US-16
router.post("/", authMiddleware, createExpense);

// US-18
router.put("/:id", authMiddleware, updateExpense);

// US-19
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;