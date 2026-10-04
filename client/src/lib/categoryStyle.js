import {
  Car, Coffee, Dumbbell, FolderKanban, Gamepad2, Gift, GraduationCap, HeartPulse,
  House, Music, PawPrint, Plane, Receipt, Shirt, ShoppingBag, Smartphone, Tag, Utensils,
} from "lucide-react";

// icon lưu trong DB là tên (chuỗi) -> component lucide
export const ICONS = {
  utensils: Utensils, coffee: Coffee, car: Car, plane: Plane, "shopping-bag": ShoppingBag,
  receipt: Receipt, house: House, gamepad: Gamepad2, music: Music, "heart-pulse": HeartPulse,
  dumbbell: Dumbbell, "graduation-cap": GraduationCap, gift: Gift, shirt: Shirt,
  smartphone: Smartphone, "paw-print": PawPrint, tag: Tag,
};

// color lưu trong DB là mã hex
export const COLORS = ["#4a6b4d", "#7c6b3e", "#c4553f", "#d98a5f", "#8b6fb0", "#3f7c8a", "#6b7a8f", "#a35c7a"];

// Danh mục mặc định của hệ thống chưa có icon/color trong DB -> gán theo tên.
const DEFAULT_ICON = {
  "Ăn uống": "utensils", "Di chuyển": "car", "Mua sắm": "shopping-bag", "Hóa đơn": "receipt",
  "Giải trí": "gamepad", "Sức khỏe": "heart-pulse", "Giáo dục": "graduation-cap", "Khác": "tag",
};
const DEFAULT_COLOR = {
  "Ăn uống": COLORS[3], "Di chuyển": COLORS[5], "Mua sắm": COLORS[4], "Hóa đơn": COLORS[1],
  "Giải trí": COLORS[7], "Sức khỏe": COLORS[2], "Giáo dục": COLORS[0], "Khác": COLORS[6],
};

export function getCategoryStyle(category) {
  const key = category?.icon || DEFAULT_ICON[category?.name] || "tag";
  return {
    Icon: ICONS[key] ?? FolderKanban,
    color: category?.color || DEFAULT_COLOR[category?.name] || COLORS[6],
  };
}
