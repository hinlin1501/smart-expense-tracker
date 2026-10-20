const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { start_date, end_date, month, year } = req.query;

    let startDate, endDate;

    if (start_date && end_date) {
      startDate = new Date(`${start_date}T00:00:00.000Z`);
      endDate = new Date(`${end_date}T23:59:59.999Z`);
    } 
    else if (month && year) {
      startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0, 0);
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    } 
    else {
      const currentDate = new Date();
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const dateFilter = {
      gte: startDate,
      lte: endDate,
    };

    const totalIncomeResult = await prisma.incomes.aggregate({
      where: { user_id: userId, income_date: dateFilter },
      _sum: { amount: true }
    });
    const totalIncome = totalIncomeResult._sum.amount || 0;

    const totalExpenseResult = await prisma.expenses.aggregate({
      where: { user_id: userId, expense_date: dateFilter },
      _sum: { amount: true }
    });
    const totalExpense = totalExpenseResult._sum.amount || 0;

    const balance = Number(totalIncome) - Number(totalExpense);

    res.status(200).json({
      start_date: startDate,
      end_date: endDate,
      totalIncome: Number(totalIncome),
      totalExpense: Number(totalExpense),
      balance
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};