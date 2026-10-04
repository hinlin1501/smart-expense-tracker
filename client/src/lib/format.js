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
