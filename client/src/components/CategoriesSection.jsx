import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/PageTitle";
import { CategoryMark } from "@/components/CategoryMark";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { COLORS, ICONS } from "@/lib/categoryStyle";
import { cn } from "@/lib/utils";
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/services/categoryService";

function CategoryForm({ categories, initial, onClose, onSaved }) {
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon && ICONS[initial.icon] ? initial.icon : "tag");
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const value = name.trim();
    if (!value) return setError("Vui lòng nhập tên danh mục.");
    if (value.length > 100) return setError("Tên danh mục tối đa 100 ký tự.");
    const dup = categories.some((c) => c.id !== initial?.id && c.name.toLowerCase() === value.toLowerCase());
    if (dup) return setError("Tên danh mục đã tồn tại.");
    setBusy(true);
    try {
      if (editing) await updateCategory(initial.id, { name: value, icon, color });
      else await createCategory({ name: value, icon, color });
      onSaved(editing ? "Đã cập nhật danh mục" : "Đã thêm danh mục mới");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true"><form className="modal" onSubmit={submit} noValidate><div className="mb-3 flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-primary">{editing ? "Chỉnh sửa" : "Danh mục mới"}</p><h2 className="font-display text-3xl">{editing ? "Sửa danh mục" : "Thêm danh mục"}</h2></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Đóng"><X /></Button></div><div className="mb-1 flex items-center gap-3"><CategoryMark category={{ name, icon, color }} /><span className="text-sm text-muted-foreground">Xem trước</span></div><label className="field">Tên danh mục<input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Cà phê" autoFocus /></label><div className="field">Biểu tượng<div className="flex flex-wrap gap-2">{Object.entries(ICONS).map(([key, Icon]) => <button key={key} type="button" aria-pressed={icon === key} aria-label={key} onClick={() => setIcon(key)} className={cn("grid size-10 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted [&_svg]:size-4", icon === key && "border-primary bg-sage text-primary")}><Icon /></button>)}</div></div><div className="field">Màu sắc<div className="flex flex-wrap gap-3">{COLORS.map((c) => <button key={c} type="button" aria-pressed={color === c} aria-label={c} onClick={() => setColor(c)} className={cn("size-8 rounded-full border-2 border-transparent", color === c && "border-foreground ring-2 ring-background ring-offset-2 ring-offset-foreground/20")} style={{ background: c }} />)}</div></div>{error && <p role="alert" className="mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay">{error}</p>}<div className="mt-7 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu danh mục"}</Button></div></form></div>;
}

function CategoryCard({ category, onEdit, onDelete }) {
  return <article className="category-card"><CategoryMark category={category} /><div className="min-w-0 flex-1"><h3 className="truncate">{category.name}</h3><p>{category.is_default ? "Mặc định" : "Tùy chỉnh"}</p></div>{!category.is_default && <div className="flex"><Button variant="ghost" size="icon-sm" aria-label={`Sửa ${category.name}`} onClick={() => onEdit(category)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Xóa ${category.name}`} onClick={() => onDelete(category)}><Trash2 /></Button></div>}</article>;
}

export function CategoriesSection({ notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // { initial } | null
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setItems(await getCategories());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const defaults = items.filter((c) => c.is_default);
  const custom = items.filter((c) => !c.is_default);

  const confirmRemove = async () => {
    setRemoveBusy(true);
    setRemoveError("");
    try {
      await deleteCategory(removing.id);
      setRemoving(null);
      notify("Đã xóa danh mục");
      load();
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemoveBusy(false);
    }
  };

  return <><div className="flex flex-wrap items-end justify-between gap-4"><PageTitle eyebrow="Phân loại dòng tiền" title="Danh mục" text="Sắp xếp giao dịch để bạn luôn biết tiền đi đâu." /><Button onClick={() => setForm({ initial: null })}><Plus />Thêm danh mục</Button></div>{loading ? <div className="panel"><p className="py-14 text-center text-muted-foreground">Đang tải danh mục…</p></div> : error ? <div className="panel"><p role="alert" className="py-10 text-center text-clay">{error}</p><div className="flex justify-center"><Button variant="outline" onClick={() => { setLoading(true); load(); }}>Thử lại</Button></div></div> : <div className="space-y-8"><section><h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Danh mục của bạn ({custom.length})</h2>{custom.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{custom.map((c) => <CategoryCard key={c.id} category={c} onEdit={(x) => setForm({ initial: x })} onDelete={(x) => { setRemoveError(""); setRemoving(x); }} />)}</div> : <div className="panel"><p className="py-8 text-center text-muted-foreground">Bạn chưa tạo danh mục riêng nào. Hãy thêm danh mục đầu tiên.</p></div>}</section><section><h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Danh mục mặc định ({defaults.length})</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{defaults.map((c) => <CategoryCard key={c.id} category={c} />)}</div></section></div>}{form && <CategoryForm categories={items} initial={form.initial} onClose={() => setForm(null)} onSaved={(msg) => { setForm(null); notify(msg); load(); }} />}{removing && <ConfirmDialog title="Xóa danh mục?" busy={removeBusy} error={removeError} onCancel={() => setRemoving(null)} onConfirm={confirmRemove}>Bạn sắp xóa danh mục <b className="text-foreground">{removing.name}</b>. Thao tác này không thể hoàn tác.</ConfirmDialog>}</>;
}
