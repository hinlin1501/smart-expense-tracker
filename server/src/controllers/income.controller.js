const prisma = require("../lib/prisma");

// Kiểm tra ID nguyên dương
function parsePositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

// Kiểm tra số tiền hợp lệ
function parsePositiveAmount(value) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

// Kiểm tra ngày YYYY-MM-DD hợp lệ
function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

// Chuẩn hóa ngày theo UTC
function toUTCDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

// Kiểm tra category có thuộc người dùng hoặc là category mặc định
async function isAccessibleCategory(categoryId, userId) {
  const category = await prisma.categories.findFirst({
    where: {
      id: categoryId,
      OR: [{ is_default: true }, { user_id: userId }],
    },
    select: { id: true },
  });

  return Boolean(category);
}

// US-11: Thêm khoản thu nhập
exports.createIncome = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { amount, category_id, income_date, note } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsedAmount = parsePositiveAmount(amount);
    const categoryId = parsePositiveInt(category_id);

    if (parsedAmount === null) {
      return res.status(400).json({
        message: "Số tiền phải lớn hơn 0",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        message: "Category không hợp lệ",
      });
    }

    if (!isValidDate(income_date)) {
      return res.status(400).json({
        message: "Ngày thu nhập không hợp lệ",
      });
    }

    if (note !== undefined && note !== null && typeof note !== "string") {
      return res.status(400).json({
        message: "Note phải là chuỗi ký tự",
      });
    }

    const categoryAccessible = await isAccessibleCategory(
      categoryId,
      userId
    );

    if (!categoryAccessible) {
      return res.status(400).json({
        message: "Category không tồn tại hoặc không có quyền truy cập",
      });
    }

    const income = await prisma.incomes.create({
      data: {
        user_id: userId,
        category_id: categoryId,
        amount: parsedAmount,
        income_date: toUTCDate(income_date),
        note: note?.trim() || null,
      },
    });

    return res.status(201).json({
      message: "Thêm thu nhập thành công",
      income,
    });
  } catch (error) {
    console.error("Create income error:", error);

    return res.status(500).json({
      message: "Máy chủ đang gặp sự cố",
    });
  }
};

// US-12 & US-15: Xem danh sách và lọc/tìm kiếm thu nhập
exports.getIncomes = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      category_id,
      start_date,
      end_date,
      month,
      year,
      search,
    } = req.query;

    const whereClause = { user_id: userId };

    // Lọc theo danh mục
    if (category_id !== undefined) {
      const categoryId = parsePositiveInt(category_id);

      if (!categoryId) {
        return res.status(400).json({
          message: "Category ID không hợp lệ",
        });
      }

      whereClause.category_id = categoryId;
    }

    // Lọc theo khoảng ngày
    if (start_date !== undefined || end_date !== undefined) {
      if (
        !isValidDate(start_date) ||
        !isValidDate(end_date) ||
        start_date > end_date
      ) {
        return res.status(400).json({
          message: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ",
        });
      }

      whereClause.income_date = {
        gte: toUTCDate(start_date),
        lte: new Date(`${end_date}T23:59:59.999Z`),
      };
    }

    // Lọc theo tháng và năm
    else if (month !== undefined || year !== undefined) {
      const monthNumber = Number(month);
      const yearNumber = Number(year);

      if (
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12 ||
        !Number.isInteger(yearNumber) ||
        yearNumber < 1900 ||
        yearNumber > 9999
      ) {
        return res.status(400).json({
          message: "Tháng hoặc năm không hợp lệ",
        });
      }

      whereClause.income_date = {
        gte: new Date(Date.UTC(yearNumber, monthNumber - 1, 1)),
        lte: new Date(
          Date.UTC(yearNumber, monthNumber, 0, 23, 59, 59, 999)
        ),
      };
    }

    // Tìm kiếm theo ghi chú
    if (search !== undefined) {
      if (typeof search !== "string") {
        return res.status(400).json({
          message: "Search phải là chuỗi ký tự",
        });
      }

      if (search.trim()) {
        whereClause.note = {
          contains: search.trim(),
          mode: "insensitive",
        };
      }
    }

    const incomes = await prisma.incomes.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: [{ income_date: "desc" }, { id: "desc" }],
    });

    return res.status(200).json({ incomes });
  } catch (error) {
    console.error("Get incomes error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// US-13: Chỉnh sửa thu nhập
exports.updateIncome = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const incomeId = parsePositiveInt(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!incomeId) {
      return res.status(400).json({
        message: "Income ID không hợp lệ",
      });
    }

    const { amount, category_id, income_date, note } = req.body;
    const data = {};

    // Kiểm tra và cập nhật số tiền nếu được cung cấp
    if (amount !== undefined) {
      const parsedAmount = parsePositiveAmount(amount);

      if (parsedAmount === null) {
        return res.status(400).json({
          message: "Số tiền phải lớn hơn 0",
        });
      }

      data.amount = parsedAmount;
    }

    // Kiểm tra và cập nhật danh mục nếu được cung cấp
    if (category_id !== undefined) {
      const categoryId = parsePositiveInt(category_id);

      if (!categoryId) {
        return res.status(400).json({
          message: "Category không hợp lệ",
        });
      }

      const categoryAccessible = await isAccessibleCategory(
        categoryId,
        userId
      );

      if (!categoryAccessible) {
        return res.status(400).json({
          message: "Category không tồn tại hoặc không có quyền truy cập",
        });
      }

      data.category_id = categoryId;
    }

    // Kiểm tra và cập nhật ngày nếu được cung cấp
    if (income_date !== undefined) {
      if (!isValidDate(income_date)) {
        return res.status(400).json({
          message: "Ngày thu nhập không hợp lệ",
        });
      }

      data.income_date = toUTCDate(income_date);
    }

    // Kiểm tra và cập nhật ghi chú nếu được cung cấp
    if (note !== undefined) {
      if (note !== null && typeof note !== "string") {
        return res.status(400).json({
          message: "Note phải là chuỗi ký tự",
        });
      }

      data.note = note?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Không có thông tin cần cập nhật",
      });
    }

    const result = await prisma.incomes.updateMany({
      where: {
        id: incomeId,
        user_id: userId,
      },
      data,
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Không tìm thấy thu nhập",
      });
    }

    return res.status(200).json({
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.error("Update income error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// US-14: Xóa thu nhập
exports.deleteIncome = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const incomeId = parsePositiveInt(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!incomeId) {
      return res.status(400).json({
        message: "Income ID không hợp lệ",
      });
    }

    const result = await prisma.incomes.deleteMany({
      where: {
        id: incomeId,
        user_id: userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Không tìm thấy thu nhập",
      });
    }

    return res.status(200).json({
      message: "Xóa thành công",
    });
  } catch (error) {
    console.error("Delete income error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};