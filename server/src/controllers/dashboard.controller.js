
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

// US-32: Lấy dữ liệu biểu đồ xu hướng thu - chi theo Tuần (7 ngày) hoặc Tháng (6 tháng)
exports.getDashboardChart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const period = req.query.period === "week" ? "week" : "month";
    const now = new Date();

    const rangeStart =
      period === "week"
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6))
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const rangeEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const [incomes, expenses] = await Promise.all([
      prisma.incomes.findMany({
        where: { user_id: userId, income_date: { gte: rangeStart, lte: rangeEnd } },
        select: { amount: true, income_date: true },
      }),
      prisma.expenses.findMany({
        where: { user_id: userId, expense_date: { gte: rangeStart, lte: rangeEnd } },
        select: { amount: true, expense_date: true },
      }),
    ]);

    const series =
      period === "week"
        ? Array.from({ length: 7 }, (_, i) => {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - i)));
            const key = d.toISOString().slice(0, 10);
            const label = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
            const income = incomes
              .filter((x) => new Date(x.income_date).toISOString().slice(0, 10) === key)
              .reduce((s, x) => s + Number(x.amount), 0);
            const expense = expenses
              .filter((x) => new Date(x.expense_date).toISOString().slice(0, 10) === key)
              .reduce((s, x) => s + Number(x.amount), 0);
            return { label, date: key, income, expense };
          })
        : Array.from({ length: 6 }, (_, i) => {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
            const ym = d.toISOString().slice(0, 7);
            const label = `Thg ${d.getUTCMonth() + 1}`;
            const income = incomes
              .filter((x) => new Date(x.income_date).toISOString().slice(0, 7) === ym)
              .reduce((s, x) => s + Number(x.amount), 0);
            const expense = expenses
              .filter((x) => new Date(x.expense_date).toISOString().slice(0, 7) === ym)
              .reduce((s, x) => s + Number(x.amount), 0);
            return { label, month: ym, income, expense };
          });

    return res.status(200).json({ period, series });
  } catch (error) {
    console.error("Dashboard chart error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// US-33: Xuất báo cáo thu - chi (format = excel | pdf)
exports.exportReport = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const format = req.query.format === "pdf" ? "pdf" : "excel";
    const { start_date, end_date } = req.query;

    const currentDate = new Date();
    const startDate = isValidDate(start_date)
      ? new Date(`${start_date}T00:00:00.000Z`)
      : new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1));
    const endDate = isValidDate(end_date)
      ? new Date(`${end_date}T23:59:59.999Z`)
      : new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const [incomes, expenses] = await Promise.all([
      prisma.incomes.findMany({
        where: { user_id: userId, income_date: { gte: startDate, lte: endDate } },
        include: { category: { select: { name: true } } },
        orderBy: { income_date: "desc" },
      }),
      prisma.expenses.findMany({
        where: { user_id: userId, expense_date: { gte: startDate, lte: endDate } },
        include: { category: { select: { name: true } } },
        orderBy: { expense_date: "desc" },
      }),
    ]);

    const totalIncome = incomes.reduce((s, x) => s + Number(x.amount), 0);
    const totalExpense = expenses.reduce((s, x) => s + Number(x.amount), 0);
    const savingRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    const items = [
      ...incomes.map((i) => ({
        type: "Thu nhập",
        category: i.category?.name || "Khác",
        date: new Date(i.income_date).toISOString().slice(0, 10),
        amount: Number(i.amount),
        note: i.note || "",
      })),
      ...expenses.map((e) => ({
        type: "Chi tiêu",
        category: e.category?.name || "Khác",
        date: new Date(e.expense_date).toISOString().slice(0, 10),
        amount: -Number(e.amount),
        note: e.note || "",
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    if (format === "pdf") {
      // Trả về dữ liệu chuẩn hóa để Frontend render/in PDF hoặc tải trực tiếp
      return res.status(200).json({
        format: "pdf",
        generatedAt: new Date().toISOString(),
        summary: { totalIncome, totalExpense, savingRate },
        items,
      });
    }

    // Tạo file Excel (.xls) chuẩn UTF-8 để trình duyệt tải xuống trực tiếp
    const escapeXml = (str) =>
      String(str ?? "")
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">");

    const rowsHtml = items
      .map(
        (x) =>
          `<tr><td>${x.type}</td><td>${escapeXml(x.category)}</td><td>${x.date}</td><td>${x.amount}</td><td>${escapeXml(x.note)}</td></tr>`
      )
      .join("");

    const excelHtml = `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body><h3>BÁO CÁO THU - CHI</h3><table border="1"><tr><th>Tổng thu</th><th>Tổng chi</th><th>Tỷ lệ tiết kiệm</th></tr><tr><td>${totalIncome}</td><td>${totalExpense}</td><td>${savingRate}%</td></tr></table><br/><table border="1"><tr><th>Loại</th><th>Danh mục</th><th>Ngày</th><th>Số tiền (₫)</th><th>Ghi chú</th></tr>${rowsHtml}</table></body></html>`;

    res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="bao-cao-thu-chi.xls"`);
    return res.status(200).send(excelHtml);
  } catch (error) {
    console.error("Export report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
