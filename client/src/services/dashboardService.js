import axiosClient from "./axiosClient";

export const getDashboardSummary = async (params) => {
  const response = await axiosClient.get("/dashboard", { params });
  return response.data || response;
};

// US-32: GET /dashboard/chart?period=week|month
// -> { period, series: [{ label, income, expense, date | month }] }
// week = 7 ngày gần nhất (theo ngày), month = 6 tháng gần nhất (theo tháng)
export const getDashboardChart = async (period) => {
  const { data } = await axiosClient.get("/dashboard/chart", { params: { period } });
  return data;
};

// US-33: GET /dashboard/export?format=excel&start_date&end_date -> file .xls (blob)
export const exportReportExcel = async ({ start_date, end_date }) => {
  const { data } = await axiosClient.get("/dashboard/export", {
    params: { format: "excel", start_date, end_date },
    responseType: "blob",
  });
  return data;
};

// US-33: GET /dashboard/export?format=pdf&start_date&end_date
// -> { format, generatedAt, summary: { totalIncome, totalExpense, savingRate },
//      items: [{ type, category, date, amount (chi tiêu là số âm), note }] }
export const getReportData = async ({ start_date, end_date }) => {
  const { data } = await axiosClient.get("/dashboard/export", {
    params: { format: "pdf", start_date, end_date },
  });
  return data;
};
