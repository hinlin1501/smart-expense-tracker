const prisma = require("../lib/prisma");

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

    // Kiểm tra category
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

    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    // Category phải là category mặc định hoặc thuộc user hiện tại
    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        OR: [
          {
            is_default: true,
          },
          {
            user_id: userId,
          },
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

    const expenseDate = new Date(`${expense_date}T00:00:00`);

    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        message: "Invalid expense date",
      });
    }

    const expense = await prisma.expenses.create({
      data: {
        user_id: userId,
        category_id: categoryId,
        amount: numericAmount,
        expense_date: expenseDate,
        note: note ? note.trim() : null,
      },
    });

    return res.status(201).json({
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// US-17 + US-20: Xem, phân trang, lọc và tìm kiếm
const getExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
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

    // Lọc theo category
    if (category_id !== undefined) {
      const categoryId = Number(category_id);

      if (!Number.isInteger(categoryId)) {
        return res.status(400).json({
          message: "Invalid category ID",
        });
      }

      where.category_id = categoryId;
    }

    // Lọc từ ngày
    if (start_date) {
      const startDate = new Date(`${start_date}T00:00:00`);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          message: "Invalid start date",
        });
      }

      where.expense_date = {
        ...where.expense_date,
        gte: startDate,
      };
    }

    // Lọc đến ngày
    if (end_date) {
      const endDate = new Date(`${end_date}T00:00:00`);

      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: "Invalid end date",
        });
      }

      // Bao gồm toàn bộ ngày end_date
      endDate.setDate(endDate.getDate() + 1);

      where.expense_date = {
        ...where.expense_date,
        lt: endDate,
      };
    }

    // Tìm kiếm theo note
    if (search && search.trim()) {
      where.note = {
        contains: search.trim(),
        mode: "insensitive",
      };
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

      prisma.expenses.count({
        where,
      }),
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

    if (!Number.isInteger(expenseId)) {
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

    // Kiểm tra amount
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

    // Kiểm tra category
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

    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        OR: [
          {
            is_default: true,
          },
          {
            user_id: userId,
          },
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

    const expenseDate = new Date(`${expense_date}T00:00:00`);

    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        message: "Invalid expense date",
      });
    }

    const updatedExpense = await prisma.expenses.update({
      where: {
        id: expenseId,
      },
      data: {
        amount: numericAmount,
        category_id: categoryId,
        expense_date: expenseDate,
        note: note ? note.trim() : null,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      message: "Expense updated successfully",
      expense: updatedExpense,
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

    if (!Number.isInteger(expenseId)) {
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

    await prisma.expenses.delete({
      where: {
        id: expenseId,
      },
    });

    return res.status(200).json({
      message: "Expense deleted successfully",
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