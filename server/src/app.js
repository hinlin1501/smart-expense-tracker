const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const expenseRoutes = require("./routes/expense.routes");
const incomeRoutes = require('./routes/income.routes'); 
const dashboardRoutes = require('./routes/dashboard.routes');

dotenv.config();

const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use('/api/incomes', incomeRoutes); 
app.use('/api/dashboard', dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Smart Expense Tracker API is running",
  });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});