import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/PageTitle";
import { CategoryMark } from "@/components/CategoryMark";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { fmtDateOnly, money, todayInput, toDateOnly } from "@/lib/format";
import { getCategories } from "@/services/categoryService";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "@/services/expenseService";
import { createIncome, deleteIncome, getIncomes, updateIncome } from "@/services/incomeService";

const PAGE_SIZE = 10;
const MAX_AMOUNT = 9999999999999;
const NO_FILTERS = { search: "", categoryId: "", start: "", end: "" };

// Cấu hình riêng cho từng loại giao dịch (US-11→15 thu nhập, US-16→20 chi tiêu).
const KINDS = {
  expense: {
    title: "Chi tiêu", noun: "khoản chi tiêu", listKey: "expenses", dateField: "expense_date",
    dateLabel: "Ngày chi tiêu", dateRequired: "Vui lòng chọn ngày chi tiêu.",
    categoryLabel: "Danh mục", categoryHeader: "Danh mục", allCategories: "Tất cả danh mục",
    sign: "−", amountClass: "", notePlaceholder: "Ví dụ: Đi chợ cuối tuần",
    formEyebrow: "Giao dịch mới", addTitle: "Thêm chi tiêu", editTitle: "Sửa chi tiêu", saveText: "Lưu chi tiêu",
    added: "Đã thêm khoản chi tiêu", updated: "Đã cập nhật khoản chi tiêu", removed: "Đã xóa khoản chi tiêu",
    deleteTitle: "Xóa khoản chi tiêu?", empty: "Bạn chưa có khoản chi tiêu nào. Hãy thêm khoản đầu tiên.",
    api: { list: getExpenses, create: createExpense, update: updateExpense, remove: deleteExpense },
  },
  income: {
    title: "Thu nhập", noun: "khoản thu nhập", listKey: "incomes", dateField: "income_date",
    dateLabel: "Ngày nhận", dateRequired: "Vui lòng chọn ngày nhận.",
    categoryLabel: "Nguồn thu nhập / Danh mục", categoryHeader: "Nguồn thu", allCategories: "Tất cả nguồn thu",
    sign: "+", amountClass: "text-success", notePlaceholder: "Ví dụ: Lương tháng 10",
    formEyebrow: "Giao dịch mới", addTitle: "Thêm thu nhập", editTitle: "Sửa thu nhập", saveText: "Lưu thu nhập",
    added: "Đã thêm khoản thu nhập", updated: "Đã cập nhật khoản thu nhập", removed: "Đã xóa khoản thu nhập",
    deleteTitle: "Xóa khoản thu nhập?", empty: "Bạn chưa có khoản thu nhập nào. Hãy thêm khoản đầu tiên.",
    api: { list: getIncomes, create: createIncome, update: updateIncome, remove: deleteIncome },
  },
};

function TransactionForm({ cfg, categories, initial, onClose, onSaved, onGoCategories }) {
  const editing = !!initial;
  const [amount, setAmount] = useState(initial ? String(Number(initial.amount)) : "");
  const [categoryId, setCategoryId] = useState(initial ? String(initial.category_id) : "");
  const [date, setDate] = useState(initial ? toDateOnly(initial[cfg.dateField]) : todayInput());
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!amount) return setError("Vui lòng nhập số tiền.");
    if (!Number.isFinite(value) || value <= 0) return setError("Số tiền phải lớn hơn 0.");
    if (value > MAX_AMOUNT) return setError("Số tiền quá lớn.");
    if (!categoryId) return setError("Vui lòng chọn danh mục.");
    if (!date) return setError(cfg.dateRequired);
    const body = { amount: value, category_id: Number(categoryId), [cfg.dateField]: date, note: note.trim() };
    setBusy(true);
    try {
      if (editing) await cfg.api.update(initial.id, body);
      else await cfg.api.create(body);
      onSaved(editing ? cfg.updated : cfg.added);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true"><form className="modal" onSubmit={submit} noValidate><div className="mb-3 flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-primary">{editing ? "Chỉnh sửa" : cfg.formEyebrow}</p><h2 className="font-display text-3xl">{editing ? cfg.editTitle : cfg.addTitle}</h2></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Đóng"><X /></Button></div><label className="field">Số tiền (₫)<input type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus /></label><label className="field">{cfg.categoryLabel}<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Chọn danh mục</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{!categories.length && <p className="mt-2 text-xs text-muted-foreground">Chưa có danh mục nào để chọn. <button type="button" className="font-bold text-primary underline" onClick={() => { onClose(); onGoCategories?.(); }}>Tạo danh mục</button></p>}<label className="field">{cfg.dateLabel}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="field">Ghi chú (không bắt buộc)<input value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} placeholder={cfg.notePlaceholder} /></label>{error && <p role="alert" className="mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay">{error}</p>}<div className="mt-7 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? "Đang lưu…" : cfg.saveText}</Button></div></form></div>;
}

export function TransactionsSection({ kind, notify, pendingAdd, onPendingHandled, onGoCategories }) {
  const cfg = KINDS[kind];
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState(null); // { initial } | null
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Danh mục cho ô lọc và biểu mẫu
  useEffect(() => {
    getCategories().then(setCategories).catch((err) => setError(err.message));
  }, []);

  // Nút "Thêm giao dịch" ở thanh trên cùng
  useEffect(() => {
    if (pendingAdd) {
      setForm({ initial: null });
      onPendingHandled?.();
    }
  }, [pendingAdd, onPendingHandled]);

  // Tìm kiếm theo ghi chú: chờ người dùng ngừng gõ 400ms
  useEffect(() => {
    const id = window.setTimeout(() => {
      const value = searchInput.trim();
      setFilters((f) => (f.search === value ? f : { ...f, search: value }));
      setPage(1);
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const rangeError = filters.start && filters.end && filters.start > filters.end ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc." : "";

  useEffect(() => {
    if (rangeError) return undefined;
    let cancelled = false;
    setLoading(true);
    cfg.api.list({ page, limit: PAGE_SIZE, search: filters.search, category_id: filters.categoryId, start_date: filters.start, end_date: filters.end })
      .then((res) => {
        if (cancelled) return;
        const items = res[cfg.listKey] ?? [];
        setData({ items, pagination: res.pagination ?? { page, limit: PAGE_SIZE, total: items.length, totalPages: 1 } });
        setError("");
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cfg, page, filters, rangeError, reloadKey]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const hasFilters = !!(filters.search || filters.categoryId || filters.start || filters.end);
  const clearFilters = () => {
    setSearchInput("");
    setFilters(NO_FILTERS);
    setPage(1);
  };

  const { items, pagination } = data;
  const from = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const to = from ? from + items.length - 1 : 0;

  const confirmRemove = async () => {
    setRemoveBusy(true);
    setRemoveError("");
    try {
      await cfg.api.remove(removing.id);
      setRemoving(null);
      notify(cfg.removed);
      if (items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemoveBusy(false);
    }
  };

  return <><div className="flex flex-wrap items-end justify-between gap-4"><PageTitle title={cfg.title} text={`Theo dõi và quản lý các ${cfg.noun} của bạn.`} /><Button onClick={() => setForm({ initial: null })}><Plus />{cfg.addTitle}</Button></div><div className="panel"><div className="mb-3 flex flex-wrap gap-3"><label className="search-box"><Search /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm theo ghi chú..." aria-label="Tìm theo ghi chú" /></label><select className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-semibold" value={filters.categoryId} onChange={(e) => setFilter("categoryId", e.target.value)} aria-label={cfg.allCategories}><option value="">{cfg.allCategories}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Từ<input type="date" className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground" value={filters.start} max={filters.end || undefined} onChange={(e) => setFilter("start", e.target.value)} /></label><label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Đến<input type="date" className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground" value={filters.end} min={filters.start || undefined} onChange={(e) => setFilter("end", e.target.value)} /></label>{hasFilters && <Button variant="ghost" onClick={clearFilters}><X />Xóa bộ lọc</Button>}</div>{rangeError && <p role="alert" className="mb-3 text-sm font-medium text-clay">{rangeError}</p>}{error ? <div><p role="alert" className="py-10 text-center text-clay">{error}</p><div className="flex justify-center"><Button variant="outline" onClick={() => { setError(""); reload(); }}>Thử lại</Button></div></div> : <div className="overflow-x-auto" aria-busy={loading}><table className="data-table"><thead><tr><th>Ghi chú</th><th>{cfg.categoryHeader}</th><th>Ngày</th><th className="text-right">Số tiền</th><th /></tr></thead><tbody className={loading ? "opacity-50" : undefined}>{items.map((x) => <tr key={x.id}><td><b>{x.note || <span className="font-normal text-muted-foreground">—</span>}</b></td><td><span className="inline-flex items-center gap-2">{x.category && <CategoryMark category={x.category} size="sm" />}<span>{x.category?.name ?? "—"}</span></span></td><td className="text-muted-foreground">{fmtDateOnly(x[cfg.dateField])}</td><td className={`text-right font-semibold ${cfg.amountClass}`}>{cfg.sign}{money(x.amount)}</td><td><div className="flex justify-end"><Button variant="ghost" size="icon-sm" aria-label="Sửa" onClick={() => setForm({ initial: x })}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label="Xóa" onClick={() => { setRemoveError(""); setRemoving(x); }}><Trash2 /></Button></div></td></tr>)}</tbody></table>{!items.length && <p className="py-14 text-center text-muted-foreground">{loading ? "Đang tải…" : hasFilters ? "Không có dữ liệu phù hợp." : cfg.empty}</p>}</div>}{!error && pagination.total > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>Hiển thị {from}–{to} / {pagination.total} khoản</span><div className="flex items-center gap-2"><Button variant="outline" size="icon-sm" aria-label="Trang trước" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}><ChevronLeft /></Button><span>Trang {pagination.page} / {pagination.totalPages}</span><Button variant="outline" size="icon-sm" aria-label="Trang sau" disabled={page >= pagination.totalPages || loading} onClick={() => setPage(page + 1)}><ChevronRight /></Button></div></div>}</div>{form && <TransactionForm cfg={cfg} categories={categories} initial={form.initial} onGoCategories={onGoCategories} onClose={() => setForm(null)} onSaved={(msg) => { setForm(null); notify(msg); if (!form.initial) setPage(1); reload(); }} />}{removing && <ConfirmDialog title={cfg.deleteTitle} busy={removeBusy} error={removeError} onCancel={() => setRemoving(null)} onConfirm={confirmRemove}>Khoản <b className="text-foreground">{cfg.sign}{money(removing.amount)}</b>{removing.category ? ` · ${removing.category.name}` : ""} · {fmtDateOnly(removing[cfg.dateField])} sẽ bị xóa. Thao tác này không thể hoàn tác.</ConfirmDialog>}</>;
}
