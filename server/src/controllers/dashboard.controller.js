
const prisma = require("../lib/prisma");

// Kiểm tra ngày theo định dạng YYYY-MM-DD
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

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { start_date, end_date, month, year } = req.query;

    let startDate;
    let endDate;

    // Trường hợp lọc theo khoảng ngày
    if (start_date !== undefined || end_date !== undefined) {
      if (
        !isValidDate(start_date) ||
        !isValidDate(end_date) ||
        start_date > end_date
      ) {
        return res.status(400).json({
          message: "Invalid start_date or end_date",
        });
      }

      startDate = new Date(`${start_date}T00:00:00.000Z`);
      endDate = new Date(`${end_date}T23:59:59.999Z`);
    }

    // Trường hợp lọc theo tháng và năm
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
          message: "Invalid month or year",
        });
      }

      startDate = new Date(
        Date.UTC(yearNumber, monthNumber - 1, 1)
      );

      endDate = new Date(
        Date.UTC(yearNumber, monthNumber, 0, 23, 59, 59, 999)
      );
    }

    // Mặc định: tháng hiện tại theo UTC
    else {
      const currentDate = new Date();
      const currentYear = currentDate.getUTCFullYear();
      const currentMonth = currentDate.getUTCMonth();

      startDate = new Date(
        Date.UTC(currentYear, currentMonth, 1)
      );

      endDate = new Date(
        Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
      );
    }

    const dateFilter = {
      gte: startDate,
      lte: endDate,
    };

    const [totalIncomeResult, totalExpenseResult] = await Promise.all([
      prisma.incomes.aggregate({
        where: {
          user_id: userId,
          income_date: dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.expenses.aggregate({
        where: {
          user_id: userId,
          expense_date: dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalIncome = Number(totalIncomeResult._sum.amount || 0);
    const totalExpense = Number(totalExpenseResult._sum.amount || 0);
    const balance = totalIncome - totalExpense;

    return res.status(200).json({
      start_date: startDate,
      end_date: endDate,
      totalIncome,
      totalExpense,
      balance,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
