import { money } from "@/lib/format";

// 80% trở lên: sắp chạm hạn mức; trên 100%: vượt ngân sách (US-29). Cờ `alert` do server tính.
export const formatPercent = (value) => `${Number(Number(value).toFixed(1)).toString().replace(".", ",")}%`;

export function alertInfo(usage) {
  if (!usage) return { level: "none", message: "" };
  const name = usage.category_name;
  if (usage.alert === "OVER_BUDGET") {
    return {
      level: "over",
      message: `Chi tiêu "${name}" đã vượt ngân sách ${money(usage.spent_amount - usage.budget_amount)}.`,
    };
  }
  if (usage.alert === "NEAR_BUDGET_LIMIT") {
    return {
      level: "near",
      message: `Chi tiêu "${name}" đã đạt ${formatPercent(usage.usage_percentage)} ngân sách.`,
    };
  }
  return { level: "none", message: "" };
}
