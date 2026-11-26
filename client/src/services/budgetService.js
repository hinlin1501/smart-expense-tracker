import axiosClient from "@/services/axiosClient";
import { call } from "@/services/apiError";

// GET /budgets -> { budgets: [{ id, category_id, category_name, amount, start_date, end_date }] }
export const getBudgets = async () => (await call(axiosClient.get("/budgets"))).budgets;

// POST /budgets { category_id, amount, start_date, end_date } (US-25)
export const createBudget = (body) => call(axiosClient.post("/budgets", body));

// PUT /budgets/:id { amount, start_date, end_date } (US-26)
export const updateBudget = (id, body) => call(axiosClient.put(`/budgets/${id}`, body));

// DELETE /budgets/:id (US-27)
export const deleteBudget = (id) => call(axiosClient.delete(`/budgets/${id}`));

// GET /budgets/:id/usage (US-28)
// -> { budget_amount, spent_amount, remaining_amount, usage_percentage, exceeded, alert }
export const getBudgetUsage = (id) => call(axiosClient.get(`/budgets/${id}/usage`));
