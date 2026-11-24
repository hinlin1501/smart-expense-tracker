const prisma = require("../lib/prisma");
function isValidExpenseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * US-29: Tính mức sử dụng ngân sách sau khi chi tiêu thay đổi.
 * Chỉ trả về các ngân sách có mức sử dụng từ 80% trở lên.
 */
const getBudgetAlerts = async (userId, categoryId, expenseDate) => {
  const budgets = await prisma.budgets.findMany({
    where: {
      user_id: userId,
      category_id: categoryId,
      start_date: { lte: expenseDate },
      end_date: { gte: expenseDate },
    },
    orderBy: { start_date: "desc" },
  });

  const alerts = [];

  for (const budget of budgets) {
    const result = await prisma.expenses.aggregate({
      where: {
        user_id: userId,
        category_id: categoryId,
        expense_date: {
          gte: budget.start_date,
          lte: budget.end_date,
        },
      },
      _sum: { amount: true },
    });

    const budgetAmount = Number(budget.amount);
    const spentAmount = Number(result._sum.amount || 0);
    const usagePercentage = Number(
      ((spentAmount / budgetAmount) * 100).toFixed(2)
    );

    let status = "NORMAL";

    if (usagePercentage > 100) {
      status = "OVER_BUDGET";
    } else if (usagePercentage >= 80) {
      status = "NEAR_BUDGET_LIMIT";
    }

    if (status !== "NORMAL") {
      alerts.push({
        budget_id: budget.id,
        category_id: categoryId,
        budget_amount: budgetAmount,
        spent_amount: spentAmount,
        remaining_amount: budgetAmount - spentAmount,
        usage_percentage: usagePercentage,
        status,
      });
    }
  }

  return alerts;
};

// Tính cảnh báo an toàn: lỗi cảnh báo không làm thay đổi
// kết quả của thao tác tạo, cập nhật hoặc xóa chi tiêu.
const getBudgetAlertsSafely = async (userId, categoryId, expenseDate) => {
  try {
    const alerts = await getBudgetAlerts(
      userId,
      categoryId,
      expenseDate
    );

    return {
      alerts,
      warning: null,
    };
  } catch (error) {
    console.error("Calculate budget alerts error:", error);

    return {
      alerts: null,
      warning: "Unable to calculate budget alerts",
    };
  }
};

// US-16: Thêm khoản chi tiêu
const createExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, category_id, expense_date, note } = req.body;

    // Kiểm tra số tiền
    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        message: "Amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    // Kiểm tra danh mục
    if (
      category_id === undefined ||
      category_id === null ||
      category_id === ""
    ) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    const categoryId = Number(category_id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    // Danh mục phải là danh mục mặc định hoặc thuộc người dùng hiện tại
    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        OR: [
          { is_default: true },
          { user_id: userId },
        ],
      },
    });

    if (!category) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    // Kiểm tra ngày chi tiêu
    if (!expense_date) {
      return res.status(400).json({
        message: "Expense date is required",
      });
    }

    if (!isValidExpenseDate(expense_date)) {
  return res.status(400).json({
    message: "Invalid expense date. Use YYYY-MM-DD format.",
  });
}
if (expense_date > getTodayDateString()) {
      return res.status(400).json({
        message: "Expense date cannot be in the future.",
      });
    }

const expenseDate = new Date(`${expense_date}T00:00:00`);

    const expense = await prisma.expenses.create({
      data: {
        user_id: userId,
        category_id: categoryId,
        amount: numericAmount,
        expense_date: expenseDate,
        note: note ? note.trim() : null,
      },
    });

    // US-29: Tính cảnh báo sau khi tạo khoản chi
    const alertResult = await getBudgetAlertsSafely(
  userId,
  categoryId,
  expenseDate
);

    return res.status(201).json({
  message: "Expense created successfully",
  expense,
  budget_alerts: alertResult.alerts,
  ...(alertResult.warning && {
    warning: alertResult.warning,
  }),
});
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// US-17 + US-20: Xem, phân trang, lọc và tìm kiếm khoản chi
const getExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      month,
      year,
      category_id,
      search,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        message: "Invalid pagination parameters",
      });
    }

    const skip = (pageNumber - 1) * limitNumber;

    const where = {
      user_id: userId,
    };

    // Lọc theo danh mục
    if (category_id !== undefined) {
      const categoryId = Number(category_id);

      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.status(400).json({
          message: "Invalid category ID",
        });
      }

      where.category_id = categoryId;
    }

// Lọc từ ngày
if (start_date) {
  if (!isValidExpenseDate(start_date)) {
    return res.status(400).json({
      message: "Invalid start date. Use YYYY-MM-DD format.",
    });
  }

  const startDate = new Date(`${start_date}T00:00:00`);

  where.expense_date = {
    ...where.expense_date,
    gte: startDate,
  };
}

// Lọc đến ngày, bao gồm toàn bộ ngày end_date
if (end_date) {
  if (!isValidExpenseDate(end_date)) {
    return res.status(400).json({
      message: "Invalid end date. Use YYYY-MM-DD format.",
    });
  }

  const endDate = new Date(`${end_date}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);

  where.expense_date = {
    ...where.expense_date,
    lt: endDate,
  };
}

if (start_date && end_date && start_date > end_date) {
  return res.status(400).json({
    message: "Start date must not be after end date",
  });
}

    // Tìm kiếm theo ghi chú
    if (search && search.trim()) {
      where.note = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    // Lọc theo tháng và năm nếu được cung cấp
    // Lọc theo tháng và năm nếu được cung cấp
if (month !== undefined || year !== undefined) {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (
    (month !== undefined &&
      (!Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12)) ||
    (year !== undefined &&
      (!Number.isInteger(yearNumber) ||
        yearNumber < 1 ||
        yearNumber > 9998))
  ) {
    return res.status(400).json({
      message: "Invalid month or year",
    });
  }

  if (month !== undefined && year !== undefined) {
    const monthStart = new Date(
      yearNumber,
      monthNumber - 1,
      1
    );
    const nextMonthStart = new Date(
      yearNumber,
      monthNumber,
      1
    );

    where.expense_date = {
      ...where.expense_date,
      gte: monthStart,
      lt: nextMonthStart,
    };
  } else if (year !== undefined) {
    where.expense_date = {
      ...where.expense_date,
      gte: new Date(yearNumber, 0, 1),
      lt: new Date(yearNumber + 1, 0, 1),
    };
  } else {
    return res.status(400).json({
      message: "Month requires year",
    });
  }
}

    const [expenses, total] = await Promise.all([
      prisma.expenses.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          expense_date: "desc",
        },
        skip,
        take: limitNumber,
      }),
      prisma.expenses.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return res.status(200).json({
      expenses,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// US-18: Chỉnh sửa khoản chi tiêu
const updateExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const expenseId = Number(req.params.id);

    const {
      amount,
      category_id,
      expense_date,
      note,
    } = req.body;

    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({
        message: "Invalid expense ID",
      });
    }

    // Chỉ chủ sở hữu mới được chỉnh sửa
    const existingExpense = await prisma.expenses.findFirst({
      where: {
        id: expenseId,
        user_id: userId,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    // Kiểm tra số tiền
    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({
        message: "Amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    // Kiểm tra danh mục
    if (
      category_id === undefined ||
      category_id === null ||
      category_id === ""
    ) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    const categoryId = Number(category_id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        OR: [
          { is_default: true },
          { user_id: userId },
        ],
      },
    });

    if (!category) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    // Kiểm tra ngày
    if (!expense_date) {
      return res.status(400).json({
        message: "Expense date is required",
      });
    }

    if (!isValidExpenseDate(expense_date)) {
  return res.status(400).json({
    message: "Invalid expense date. Use YYYY-MM-DD format.",
  });
}
if (expense_date > getTodayDateString()) {
      return res.status(400).json({
        message: "Expense date cannot be in the future.",
      });
    }

const expenseDate = new Date(`${expense_date}T00:00:00`);

    const updatedExpense = await prisma.expenses.update({
      where: { id: expenseId },
      data: {
        amount: numericAmount,
        category_id: categoryId,
        expense_date: expenseDate,
        note: note ? note.trim() : null,
        updated_at: new Date(),
      },
    });

    // US-29: Tính lại cảnh báo cho danh mục/ngày mới
    const budgetAlerts = await getBudgetAlerts(
      userId,
      categoryId,
      expenseDate
    );

    // Tính lại cảnh báo cho danh mục/ngày cũ
    const previousBudgetAlerts = await getBudgetAlerts(
      userId,
      existingExpense.category_id,
      existingExpense.expense_date
    );

    return res.status(200).json({
      message: "Expense updated successfully",
      expense: updatedExpense,
      budget_alerts: budgetAlerts,
      previous_budget_alerts: previousBudgetAlerts,
    });
  } catch (error) {
    console.error("Update expense error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// US-19: Xóa khoản chi tiêu
const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const expenseId = Number(req.params.id);

    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({
        message: "Invalid expense ID",
      });
    }

    // Chỉ chủ sở hữu mới được xóa
    const expense = await prisma.expenses.findFirst({
      where: {
        id: expenseId,
        user_id: userId,
      },
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    // Lưu thông tin trước khi xóa
    const deletedCategoryId = expense.category_id;
    const deletedExpenseDate = expense.expense_date;

    // Xóa đúng một lần
    await prisma.expenses.delete({
      where: { id: expenseId },
    });

    // US-29: Tính lại cảnh báo sau khi xóa
    const budgetAlerts = await getBudgetAlerts(
      userId,
      deletedCategoryId,
      deletedExpenseDate
    );

    return res.status(200).json({
      message: "Expense deleted successfully",
      budget_alerts: budgetAlerts,
    });
  } catch (error) {
    console.error("Delete expense error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};