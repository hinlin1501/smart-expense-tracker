import { getCategoryStyle } from "@/lib/categoryStyle";

// Ô biểu tượng tròn bo góc theo màu của danh mục.
export function CategoryMark({ category, size = "md" }) {
  const { Icon, color } = getCategoryStyle(category);
  const box = size === "sm" ? "size-8 rounded-lg [&_svg]:size-4" : "size-12 rounded-xl [&_svg]:size-5";
  return <span className={`grid shrink-0 place-items-center ${box}`} style={{ background: `${color}26`, color }}><Icon /></span>;
}
