import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/PageTitle";
import { CategoryMark } from "@/components/CategoryMark";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { alertInfo, formatPercent } from "@/lib/budget";
import { fmtDateOnly, money, toDateOnly } from "@/lib/format";
import { getCategories } from "@/services/categoryService";
import { createBudget, deleteBudget, getBudgets, getBudgetUsage, updateBudget } from "@/services/budgetService";

const pad = (n) => String(n).padStart(2, "0");
const inputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Khoảng thời gian gợi ý khi tạo mới: tháng hiện tại (SRS: "ví dụ theo tháng")
const currentMonth = () => {
  const now = new Date();
  return {
    start: inputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: inputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const range = (b) => `${fmtDateOnly(b.start_date)} – ${fmtDateOnly(b.end_date)}`;

// US-25 (tạo) và US-26 (sửa số tiền + khoảng thời gian)
function BudgetForm({ categories, initial, onClose, onSaved, onGoCategories }) {
  const editing = !!initial;
  const month = currentMonth();
  const [categoryId, setCategoryId] = useState(initial ? String(initial.category_id) : "");
  const [amount, setAmount] = useState(initial ? String(Number(initial.amount)) : "");
  const [start, setStart] = useState(initial ? toDateOnly(initial.start_date) : month.start);
  const [end, setEnd] = useState(initial ? toDateOnly(initial.end_date) : month.end);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!editing && !categoryId) return setError("Vui lòng chọn danh mục áp dụng.");
    if (!amount) return setError("Vui lòng nhập số tiền ngân sách.");
    if (!Number.isFinite(value) || value <= 0) return setError("Số tiền ngân sách phải lớn hơn 0.");
    if (!start || !end) return setError("Vui lòng chọn khoảng thời gian áp dụng.");
    if (start > end) return setError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
    setBusy(true);
    try {
      if (editing) await updateBudget(initial.id, { amount: value, start_date: start, end_date: end });
      else await createBudget({ category_id: Number(categoryId), amount: value, start_date: start, end_date: end });
      onSaved(editing ? "Đã cập nhật ngân sách" : "Đã tạo ngân sách mới");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={submit} noValidate>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-primary">{editing ? "Chỉnh sửa" : "Ngân sách mới"}</p>
            <h2 className="font-display text-3xl">{editing ? "Sửa ngân sách" : "Tạo ngân sách"}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Đóng"><X /></Button>
        </div>

        <label className="field">
          Danh mục áp dụng
          {editing ? (
            <select value={categoryId} disabled aria-readonly="true">
              <option value={categoryId}>{initial.category_name}</option>
            </select>
          ) : (
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} autoFocus>
              <option value="">Chọn danh mục</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </label>
        {!editing && !categories.length && (
          <p className="mt-2 text-xs text-muted-foreground">
            Chưa có danh mục nào để chọn.{" "}
            <button type="button" className="font-bold text-primary underline" onClick={() => { onClose(); onGoCategories?.(); }}>Tạo danh mục</button>
          </p>
        )}

        <label className="field">
          Số tiền ngân sách (₫)
          <input type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus={editing} />
        </label>

        <div className="grid gap-x-3 sm:grid-cols-2">
          <label className="field">
            Từ ngày
            <input type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="field">
            Đến ngày
            <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay">{error}</p>}
        <div className="mt-7 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu ngân sách"}</Button>
        </div>
      </form>
    </div>
  );
}

const BAR_COLOR = { none: "var(--success)", near: "var(--clay)", over: "var(--destructive)" };

// US-28 (mức sử dụng) + US-29 (cảnh báo) hiển thị trên từng thẻ ngân sách
function BudgetCard({ budget, category, usage, onEdit, onDelete }) {
  const info = alertInfo(usage);
  const percent = usage ? Number(usage.usage_percentage) : 0;
  const exceeded = usage?.exceeded;

  return (
    <article className="budget-card">
      <div className="flex items-start gap-3">
        <CategoryMark category={category} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate">{budget.category_name}</h3>
          <p className="text-xs text-muted-foreground">{range(budget)}</p>
        </div>
        <div className="flex">
          <Button variant="ghost" size="icon-sm" aria-label={`Sửa ngân sách ${budget.category_name}`} onClick={() => onEdit(budget)}><Pencil /></Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Xóa ngân sách ${budget.category_name}`} onClick={() => onDelete(budget)}><Trash2 /></Button>
        </div>
      </div>

      {usage ? (
        <>
          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Đã dùng <b className="text-foreground">{money(usage.spent_amount)}</b> / {money(usage.budget_amount)}
            </p>
            <strong className="text-2xl font-bold" style={{ color: info.level === "over" ? BAR_COLOR.over : undefined }}>{formatPercent(percent)}</strong>
          </div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(percent))} aria-label={`Mức sử dụng ngân sách ${budget.category_name}`}>
            <i style={{ width: `${Math.min(100, percent)}%`, background: BAR_COLOR[info.level] }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {exceeded ? <>Vượt <b className="text-foreground">{money(usage.spent_amount - usage.budget_amount)}</b></> : <>Còn được chi <b className="text-foreground">{money(usage.remaining_amount)}</b></>}
          </p>
          {info.level !== "none" && (
            <p
              role="alert"
              className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold ${info.level === "over" ? "bg-peach text-destructive" : "bg-sand text-olive"}`}
            >
              {info.level === "over" ? <CircleAlert className="mt-px size-4 shrink-0" /> : <TriangleAlert className="mt-px size-4 shrink-0" />}
              <span>{info.level === "over" ? "Đã vượt ngân sách. " : "Sắp chạm hạn mức. "}{info.message}</span>
            </p>
          )}
        </>
      ) : (
        <p className="mt-5 text-sm text-clay">Không tải được mức sử dụng của ngân sách này.</p>
      )}
    </article>
  );
}

export function BudgetsSection({ notify, onGoCategories }) {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [usages, setUsages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // { initial } | null
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [cats, list] = await Promise.all([getCategories(), getBudgets()]);
      const results = await Promise.allSettled(list.map((b) => getBudgetUsage(b.id)));
      const map = {};
      list.forEach((b, i) => { if (results[i].status === "fulfilled") map[b.id] = results[i].value; });
      setCategories(cats);
      setBudgets(list);
      setUsages(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const categoryOf = (b) => categories.find((c) => c.id === b.category_id) ?? { name: b.category_name };
  const warned = budgets.filter((b) => alertInfo(usages[b.id]).level !== "none");

  const confirmRemove = async () => {
    setRemoveBusy(true);
    setRemoveError("");
    try {
      await deleteBudget(removing.id);
      setRemoving(null);
      notify("Đã xóa ngân sách");
      load();
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemoveBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle title="Ngân sách" text="Giữ chi tiêu trong tầm kiểm soát bằng các giới hạn rõ ràng." />
        <Button className="mb-8" onClick={() => setForm({ initial: null })}><Plus />Tạo ngân sách</Button>
      </div>

      {loading ? (
        <div className="panel"><p className="py-14 text-center text-muted-foreground">Đang tải ngân sách…</p></div>
      ) : error ? (
        <div className="panel">
          <p role="alert" className="py-10 text-center text-clay">{error}</p>
          <div className="flex justify-center"><Button variant="outline" onClick={() => { setLoading(true); load(); }}>Thử lại</Button></div>
        </div>
      ) : budgets.length ? (
        <>
          {warned.length > 0 && (
            <p role="status" className="mb-5 flex items-center gap-2 rounded-lg bg-peach px-4 py-3 text-sm font-semibold text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              Có {warned.length} ngân sách đang gần hoặc vượt hạn mức.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                category={categoryOf(b)}
                usage={usages[b.id]}
                onEdit={(x) => setForm({ initial: x })}
                onDelete={(x) => { setRemoveError(""); setRemoving(x); }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="panel"><p className="py-14 text-center text-muted-foreground">Bạn chưa tạo ngân sách nào.</p></div>
      )}

      {form && (
        <BudgetForm
          categories={categories}
          initial={form.initial}
          onGoCategories={onGoCategories}
          onClose={() => setForm(null)}
          onSaved={(msg) => { setForm(null); notify(msg); load(); }}
        />
      )}

      {removing && (
        <ConfirmDialog title="Xóa ngân sách?" busy={removeBusy} error={removeError} onCancel={() => setRemoving(null)} onConfirm={confirmRemove}>
          Ngân sách <b className="text-foreground">{removing.category_name}</b> ({range(removing)}) sẽ bị xóa và không còn được theo dõi. Thao tác này không thể hoàn tác.
        </ConfirmDialog>
      )}
    </>
  );
}
