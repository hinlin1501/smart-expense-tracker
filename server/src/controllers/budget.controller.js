
const prisma = require("../lib/prisma");

// Kiểm tra định dạng ngày YYYY-MM-DD và ngày hợp lệ
function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

// Chuẩn hóa ID nguyên dương
function parsePositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

// Nhận diện lỗi PostgreSQL khi khoảng thời gian ngân sách bị trùng
function isBudgetOverlapError(error) {
  return (
    error?.code === "23P01" ||
    error?.meta?.code === "23P01" ||
    error?.meta?.message?.includes("budgets_no_overlapping_periods") ||
    error?.message?.includes("budgets_no_overlapping_periods")
  );
}

// US-25: Tạo ngân sách
const createBudget = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const categoryId = parsePositiveInt(req.body.category_id);
const rawAmount = req.body.amount;

if (
  (typeof rawAmount !== "number" && typeof rawAmount !== "string") ||
  String(rawAmount).trim() === "" ||
  !Number.isFinite(Number(rawAmount)) ||
  Number(rawAmount) <= 0
) {
  return res.status(400).json({
    message: "Amount must be greater than zero",
  });
}

const amount = Number(rawAmount);
    const { start_date: startDate, end_date: endDate } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(401).json({ message: "Unauthorized" });
}

    if (
  !categoryId ||
  rawAmount === undefined ||
  rawAmount === null ||
  rawAmount === "" ||
  !Number.isFinite(amount) ||
  amount <= 0
) {
      return res.status(400).json({
        message: "category_id and a positive amount are required",
      });
    }

    if (
      !isValidDate(startDate) ||
      !isValidDate(endDate) ||
      startDate > endDate
    ) {
      return res.status(400).json({
        message: "Invalid start_date or end_date",
      });
    }

    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        OR: [{ is_default: true }, { user_id: userId }],
      },
      select: { id: true },
    });

    if (!category) {
      return res.status(400).json({
        message: "Category does not exist or is not accessible",
      });
    }

    const overlap = await prisma.budgets.findFirst({
      where: {
        user_id: userId,
        category_id: categoryId,
        start_date: { lte: new Date(`${endDate}T00:00:00.000Z`) },
        end_date: { gte: new Date(`${startDate}T00:00:00.000Z`) },
      },
      select: { id: true },
    });

    if (overlap) {
      return res.status(409).json({
        message: "A budget already overlaps this period for the category",
      });
    }

    const budget = await prisma.budgets.create({
      data: {
        user_id: userId,
        category_id: categoryId,
        amount,
        start_date: new Date(`${startDate}T00:00:00.000Z`),
        end_date: new Date(`${endDate}T00:00:00.000Z`),
      },
    });

    return res.status(201).json({
      message: "Budget created successfully",
      budget,
    });
  } catch (error) {
    if (isBudgetOverlapError(error)) {
      return res.status(409).json({
        message: "A budget already overlaps this period for the category",
      });
    }

    console.error("Create budget error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// US-26: Cập nhật số tiền và thời gian ngân sách
const updateBudget = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const budgetId = parsePositiveInt(req.params.id);
const rawAmount = req.body.amount;
const amount = Number(rawAmount);
    const { start_date: startDate, end_date: endDate } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!budgetId) {
      return res.status(400).json({ message: "Invalid budget ID" });
    }

    if (
  rawAmount === undefined ||
  rawAmount === null ||
  rawAmount === "" ||
  !Number.isFinite(amount) ||
  amount <= 0
) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    if (
      !isValidDate(startDate) ||
      !isValidDate(endDate) ||
      startDate > endDate
    ) {
      return res.status(400).json({
        message: "Invalid start_date or end_date",
      });
    }

    const existing = await prisma.budgets.findFirst({
      where: { id: budgetId, user_id: userId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const overlap = await prisma.budgets.findFirst({
      where: {
        id: { not: budgetId },
        user_id: userId,
        category_id: existing.category_id,
        start_date: { lte: new Date(`${endDate}T00:00:00.000Z`) },
        end_date: { gte: new Date(`${startDate}T00:00:00.000Z`) },
      },
      select: { id: true },
    });

    if (overlap) {
      return res.status(409).json({
        message: "A budget already overlaps this period for the category",
      });
    }

    const budget = await prisma.budgets.update({
      where: { id: budgetId },
      data: {
        amount,
        start_date: new Date(`${startDate}T00:00:00.000Z`),
        end_date: new Date(`${endDate}T00:00:00.000Z`),
      },
    });

    return res.json({
      message: "Budget updated successfully",
      budget,
    });
  } catch (error) {
    if (isBudgetOverlapError(error)) {
      return res.status(409).json({
        message: "A budget already overlaps this period for the category",
      });
    }

    console.error("Update budget error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// US-27: Xóa ngân sách
const deleteBudget = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const budgetId = parsePositiveInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!budgetId) {
      return res.status(400).json({ message: "Invalid budget ID" });
    }

    const result = await prisma.budgets.deleteMany({
      where: { id: budgetId, user_id: userId },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Budget not found" });
    }

    return res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Delete budget error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// US-28: Xem mức sử dụng ngân sách
const getBudgetUsage = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const budgetId = parsePositiveInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!budgetId) {
      return res.status(400).json({ message: "Invalid budget ID" });
    }

    const budget = await prisma.budgets.findFirst({
      where: { id: budgetId, user_id: userId },
      include: {
        category: { select: { name: true } },
      },
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const result = await prisma.expenses.aggregate({
      where: {
        user_id: userId,
        category_id: budget.category_id,
        expense_date: {
          gte: budget.start_date,
          lte: budget.end_date,
        },
      },
      _sum: { amount: true },
    });

    const budgetAmount = Number(budget.amount);
    const spentAmount = Number(result._sum.amount || 0);
    const remainingAmount = budgetAmount - spentAmount;
    const usagePercentage =
  budgetAmount > 0
    ? Number(((spentAmount / budgetAmount) * 100).toFixed(2))
    : 0;

    let alert = null;
    if (usagePercentage > 100) {
      alert = "OVER_BUDGET";
    } else if (usagePercentage >= 80) {
      alert = "NEAR_BUDGET_LIMIT";
    }

    return res.json({
      budget_id: budget.id,
      category_id: budget.category_id,
      category_name: budget.category.name,
      budget_amount: budgetAmount,
      spent_amount: spentAmount,
      remaining_amount: remainingAmount,
      usage_percentage: usagePercentage,
      exceeded: spentAmount > budgetAmount,
      alert,
    });
  } catch (error) {
    console.error("Get budget usage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Liệt kê ngân sách của người dùng
const getBudgets = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budgets = await prisma.budgets.findMany({
      where: { user_id: userId },
      include: {
        category: { select: { name: true } },
      },
      orderBy: [{ start_date: "desc" }, { id: "desc" }],
    });

        return res.json({
      budgets: budgets.map((budget) => ({
        ...budget,
        category_name: budget.category.name,
      })),
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetUsage,
  getBudgets,
};
