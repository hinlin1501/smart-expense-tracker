import axiosClient from "@/services/axiosClient";
import { call } from "@/services/apiError";
import { toDateOnly } from "@/lib/format";
import { alertInfo } from "@/lib/budget";

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

// US-29: sau khi thêm một khoản chi tiêu mới, tính lại mức sử dụng của ngân sách
// cùng danh mục + khoảng thời gian và trả về nội dung cảnh báo (chuỗi rỗng nếu không cần cảnh báo).
export async function getBudgetWarningForExpense({ category_id, expense_date }) {
  try {
    const budgets = await getBudgets();
    const hit = budgets.find(
      (b) =>
        b.category_id === category_id &&
        toDateOnly(b.start_date) <= expense_date &&
        expense_date <= toDateOnly(b.end_date)
    );
    if (!hit) return "";
    return alertInfo(await getBudgetUsage(hit.id)).message;
  } catch {
    return "";
  }
}
