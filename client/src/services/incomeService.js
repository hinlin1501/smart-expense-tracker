import axiosClient from "@/services/axiosClient";
import { call } from "@/services/apiError";

export const getIncomes = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  return call(axiosClient.get("/incomes", { params: clean }));
};
export const createIncome = (body) => call(axiosClient.post("/incomes", body));
export const updateIncome = (id, body) => call(axiosClient.put(`/incomes/${id}`, body));
export const deleteIncome = (id) => call(axiosClient.delete(`/incomes/${id}`));
