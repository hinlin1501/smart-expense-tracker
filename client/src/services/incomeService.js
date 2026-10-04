import axiosClient from "@/services/axiosClient";
import { call } from "@/services/apiError";

// Hợp đồng API giả định (giống /expenses), server cần cung cấp:
// GET    /incomes?page&limit&start_date&end_date&category_id&search
//        -> { incomes: [{ id, amount, category_id, income_date, note, category }], pagination }
// POST   /incomes   { amount, category_id, income_date: "YYYY-MM-DD", note }
// PUT    /incomes/:id
// DELETE /incomes/:id
export const getIncomes = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  return call(axiosClient.get("/incomes", { params: clean }));
};
export const createIncome = (body) => call(axiosClient.post("/incomes", body));
export const updateIncome = (id, body) => call(axiosClient.put(`/incomes/${id}`, body));
export const deleteIncome = (id) => call(axiosClient.delete(`/incomes/${id}`));
