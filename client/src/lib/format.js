export const money = (value) => new Intl.NumberFormat("vi-VN").format(Number(value)) + " ₫";

// "2026-09-20T00:00:00.000Z" -> "2026-09-20" (cắt chuỗi để không bị lệch múi giờ)
export const toDateOnly = (iso) => String(iso).slice(0, 10);

// "2026-09-20" -> "20/09/2026"
export const fmtDateOnly = (iso) => {
  const [y, m, d] = toDateOnly(iso).split("-");
  return `${d}/${m}/${y}`;
};

export const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Ô nhập số tiền: "1500000" -> "1.500.000" (chỉ giữ chữ số, thêm dấu chấm phân cách hàng nghìn)
export const formatAmountInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// "1.500.000" -> 1500000
export const parseAmountInput = (value) => Number(String(value ?? "").replace(/\./g, ""));

const pad2 = (n) => String(n).padStart(2, "0");

// Date -> "26/11/2026"
export const fmtDate = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

// Date | ISO string -> "26/11/2026 15:42"
export const fmtDateTime = (v) => {
  const d = new Date(v);
  return `${fmtDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};