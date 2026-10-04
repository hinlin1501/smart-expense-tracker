import axiosClient from "@/services/axiosClient";
import { call } from "@/services/apiError";

// GET /expenses?page&limit&start_date&end_date&category_id&search
// -> { expenses: [...], pagination: { page, limit, total, totalPages } }
export const getExpenses = (params = {}) => {
  // Server coi category_id rỗng là 0 => phải bỏ các tham số rỗng.
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  return call(axiosClient.get("/expenses", { params: clean }));
};

// POST /expenses { amount, category_id, expense_date: "YYYY-MM-DD", note }
export const createExpense = (body) => call(axiosClient.post("/expenses", body));

// PUT /expenses/:id
export const updateExpense = (id, body) => call(axiosClient.put(`/expenses/${id}`, body));

// DELETE /expenses/:id
export const deleteExpense = (id) => call(axiosClient.delete(`/expenses/${id}`));
