import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

// "2026-11-26" -> "26/11/2026"
const isoToView = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

// "26/11/2026" -> "2026-11-26" (null nếu không hợp lệ)
const viewToIso = (view) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(view);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
};

// Tự chèn dấu "/" khi gõ: 26112026 -> 26/11/2026
const mask = (raw) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

// Ô chọn ngày luôn hiển thị dd/mm/yyyy (không phụ thuộc ngôn ngữ trình duyệt).
// value / min / max / e.target.value đều là chuỗi ISO "yyyy-mm-dd" như <input type="date">.
export function DateInput({ value, onChange, min, max, className, ...rest }) {
  const [text, setText] = useState(isoToView(value));
  const pickerRef = useRef(null);

  useEffect(() => {
    // Đồng bộ khi giá trị bên ngoài đổi (không ghi đè lúc đang gõ dở)
    setText((cur) => (viewToIso(cur) === (value || null) || (!value && cur === "") ? cur : isoToView(value)));
  }, [value]);

  const handleText = (e) => {
    const next = mask(e.target.value);
    setText(next);
    if (next === "") return onChange?.({ target: { value: "" } });
    const iso = viewToIso(next);
    if (iso) onChange?.({ target: { value: iso } });
  };

  const invalid = text !== "" && !viewToIso(text);

  return <span className="relative inline-block shrink-0">
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/yyyy"
      maxLength={10}
      size={10}
      value={text}
      onChange={handleText}
      onBlur={() => { if (invalid) setText(isoToView(value)); }}
      aria-invalid={invalid || undefined}
      className={cn("w-full min-w-40", className, "pr-10")}
    />
    <button type="button" tabIndex={-1} aria-label="Chọn ngày" onClick={() => pickerRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><CalendarDays className="size-4" /></button>
    <input ref={pickerRef} type="date" tabIndex={-1} aria-hidden value={value || ""} min={min} max={max} onChange={(e) => { setText(isoToView(e.target.value)); onChange?.(e); }} className="pointer-events-none absolute right-2 top-1/2 size-0 opacity-0" />
  </span>;
}