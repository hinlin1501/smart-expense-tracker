const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// US-11: Thêm khoản thu nhập
exports.createIncome = async (req, res) => {
  try {
    const { amount, category_id, income_date, note } = req.body;
    
    // Sửa req.user.id thành req.user.userId ở đây:
    const userId = req.user.userId; 

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Số tiền phải lớn hơn 0" });
    }

    const income = await prisma.incomes.create({
      data: {
        user_id: userId, // Lúc này userId sẽ có giá trị số nguyên hợp lệ
        category_id: Number(category_id),
        amount: parseFloat(amount),
        income_date: new Date(income_date),
        note: note || null
      }
    });

    return res.status(201).json({ message: "Thêm thu nhập thành công", income });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Máy chủ đang gặp sự cố" });
  }
};

// US-12 & US-15: Xem danh sách và Lọc/Tìm kiếm thu nhập
exports.getIncomes = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { category_id, start_date, end_date, month, year, search } = req.query;

    let whereClause = { user_id: userId };
    if (category_id) whereClause.category_id = Number(category_id);

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      whereClause.income_date = { gte: startDate, lte: endDate };
    } else if (start_date && end_date) {
      const startDate = new Date(`${start_date}T00:00:00.000Z`);
  const endDate = new Date(`${end_date}T23:59:59.999Z`);
  whereClause.income_date = {
    gte: startDate,
    lte: endDate
      };
    }

    if (search) {
      whereClause.note = { contains: search, mode: 'insensitive' };
    }

    const incomes = await prisma.incomes.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { income_date: 'desc' }
    });
    res.status(200).json({ incomes });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// US-13: Chỉnh sửa thu nhập
exports.updateIncome = async (req, res) => {
  try {
    const incomeId = Number(req.params.id);
    const userId = req.user.id;
    const { amount, category_id, income_date, note } = req.body;

    // Đảm bảo chỉ được sửa thu nhập của chính mình (BR-05)
    const income = await prisma.incomes.updateMany({
      where: { id: incomeId, user_id: userId },
      data: {
        category_id: category_id ? Number(category_id) : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        income_date: income_date ? new Date(income_date) : undefined,
        note
      }
    });

    if (income.count === 0) return res.status(404).json({ message: "Không tìm thấy thu nhập" });
    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

// US-14: Xóa thu nhập
exports.deleteIncome = async (req, res) => {
  try {
    const incomeId = Number(req.params.id);
    const userId = req.user.id;

    const income = await prisma.incomes.deleteMany({
      where: { id: incomeId, user_id: userId }
    });

    if (income.count === 0) return res.status(404).json({ message: "Không tìm thấy thu nhập" });
    res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};