import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  WalletCards,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TransactionsSection } from "@/components/TransactionsSection";
import { CategoriesSection } from "@/components/CategoriesSection";
const initialTransactions = [];
const nav = [
  ["overview", "Tổng quan", LayoutDashboard],
  ["income", "Thu nhập", ArrowDownLeft],
  ["expenses", "Chi tiêu", ArrowUpRight],
  ["categories", "Danh mục", FolderKanban],
  ["budgets", "Ngân sách", PiggyBank],
  ["reports", "Báo cáo", BarChart3]
];
const fmtShort = (v) => v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(/\.0$/, "").replace(".", ",")}tr` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(Math.round(v));
const fmtDate = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const toInputDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseDate = (s) => {
  const [d, m, y] = s.split("/").map(Number);
  return { d: d ?? 1, m: m ?? 1, y: y ?? 1970 };
};
const EmptyState = ({ text }) => <p className="py-14 text-center text-muted-foreground">{text}</p>;
const money = (value) => new Intl.NumberFormat("vi-VN").format(value) + " ₫";
function DashboardPage() {
  const { user, logout } = useAuth();
  const email = user?.email ?? "";
  const fullName = user?.full_name ?? "";
  useEffect(() => { document.title = "Tổng quan tài chính | Sổ Mây"; }, []);
  const [section, setSection] = useState("overview");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [pendingAdd, setPendingAdd] = useState(null); // "income" | "expense" | null
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const notify = (text) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };
  const changeSection = (next) => {
    setSection(next);
    setMobileNav(false);
  };
  const addTransaction = () => {
    const kind = section === "income" ? "income" : "expense";
    setSection(kind === "income" ? "income" : "expenses");
    setPendingAdd(kind);
  };
  return <div className="min-h-screen bg-background text-foreground"><aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar p-5 transition-transform lg:translate-x-0", mobileNav ? "translate-x-0" : "-translate-x-full")}><div className="mb-10 flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><WalletCards className="size-5" /></span><div><p className="font-display text-xl font-semibold">Sổ Mây</p><p className="text-xs text-muted-foreground">Tài chính cá nhân</p></div></div><nav className="space-y-1" aria-label="Điều hướng chính">{nav.map(([key, label, Icon]) => <Button key={key} variant="ghost" onClick={() => changeSection(key)} className={cn("w-full justify-start", section === key && "bg-sidebar-accent text-sidebar-accent-foreground")}><Icon />{label}</Button>)}</nav><div className="mt-auto border-t border-border pt-5"><div className="mb-4 flex items-center gap-3 px-2"><span className="grid size-9 place-items-center rounded-full bg-sage text-primary"><User className="size-4" /></span><div className="min-w-0"><p className="text-sm font-semibold">{fullName || "Tài khoản của bạn"}</p><p className="truncate text-xs text-muted-foreground">{email}</p></div></div><Button variant="ghost" className="w-full justify-start" asChild><Link to="/tai-khoan"><Settings />Cài đặt</Link></Button><Button variant="ghost" className="w-full justify-start" onClick={logout}><LogOut />Đăng xuất</Button></div></aside>{mobileNav && <button aria-label="Đóng menu" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-overlay lg:hidden" />}<main className="min-h-screen lg:ml-64"><header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur lg:px-10"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Mở menu"><Menu /></Button><p className="hidden text-sm capitalize text-muted-foreground sm:block">{(new Date()).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</p></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Thông báo"><Bell /></Button><Button onClick={addTransaction}><Plus />Thêm giao dịch</Button></div></header><div className="mx-auto max-w-[1500px] p-5 lg:p-10">{section === "overview" && <Overview name={fullName} income={income} expense={expense} transactions={transactions} onGo={changeSection} />}{section === "income" && <TransactionsSection key="income" kind="income" notify={notify} pendingAdd={pendingAdd === "income"} onPendingHandled={() => setPendingAdd(null)} onGoCategories={() => changeSection("categories")} />}{section === "expenses" && <TransactionsSection key="expense" kind="expense" notify={notify} pendingAdd={pendingAdd === "expense"} onPendingHandled={() => setPendingAdd(null)} onGoCategories={() => changeSection("categories")} />}{section === "categories" && <CategoriesSection notify={notify} />}{section === "budgets" && <Budgets />}{section === "reports" && <Reports income={income} expense={expense} transactions={transactions} />}</div></main>{toast && <div role="status" className="fixed bottom-6 right-6 z-50 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg">{toast}</div>}</div>;
}
function PageTitle({ title, text }) {
  return <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary"></p><h1 className="font-display text-4xl font-semibold sm:text-5xl">{title}</h1><p className="mt-2 text-muted-foreground">{text}</p></div>;
}
function Overview({ name, income, expense, transactions, onGo }) {
  const balance = income - expense;
  const now = new Date();
  const incomeCount = transactions.filter((t) => t.type === "income").length;
  const expenseCount = transactions.length - incomeCount;
  return <><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><PageTitle title={name ? `Xin chào, ${name}.` : "Xin chào."} text={transactions.length ? "Đây là tình hình tài chính của bạn." : "Bạn chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên để bắt đầu."} /><Button variant="outline">Tháng {now.getMonth() + 1}, {now.getFullYear()} <ChevronDown /></Button></div><section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Tổng thu nhập" value={money(income)} note={incomeCount ? `${incomeCount} khoản thu` : "Chưa có khoản thu nào"} tone="sage" icon={<TrendingUp />} /><Stat label="Tổng chi tiêu" value={money(expense)} note={expenseCount ? `${expenseCount} khoản chi` : "Chưa có khoản chi nào"} tone="peach" icon={<TrendingDown />} /><Stat label="Số dư hiện tại" value={money(balance)} note={!transactions.length ? "Chưa có giao dịch" : balance >= 0 ? "Bạn đang đi đúng hướng" : "Chi tiêu đang vượt thu nhập"} tone="lavender" icon={<CircleDollarSign />} /><Stat label="Ngân sách còn lại" value={money(0)} note="Chưa thiết lập ngân sách" tone="sand" icon={<PiggyBank />} /></section><section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]"><div className="panel"><div className="panel-head"><div><h2>Dòng tiền 6 tháng</h2><p>Thu nhập và chi tiêu theo thời gian</p></div><span className="tag">6 tháng gần nhất</span></div><LineChart transactions={transactions} /></div><div className="panel"><div className="panel-head"><div><h2>Cơ cấu chi tiêu</h2><p>Theo từng danh mục</p></div></div><Donut transactions={transactions} /></div><div className="panel xl:col-span-2"><div className="panel-head"><div><h2>Giao dịch gần đây</h2><p>Cập nhật mới nhất</p></div><Button variant="ghost" onClick={() => onGo("expenses")}>Xem tất cả</Button></div>{transactions.length ? <TransactionTable items={transactions.slice(0, 5)} /> : <EmptyState text="Chưa có giao dịch nào." />}</div></section></>;
}
function Stat({ label, value, note, tone, icon }) {
  return <article className={cn("stat", `stat-${tone}`)}><div className="flex items-center justify-between"><p>{label}</p><span>{icon}</span></div><strong>{value}</strong><small>{note}</small></article>;
}
function LineChart({ transactions }) {
  if (!transactions.length) return <EmptyState text="Hãy thêm giao dịch đầu tiên." />;
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1));
  const series = months.map((d) => {
    const inMonth = transactions.filter((t) => {
      const p = parseDate(t.date);
      return p.m === d.getMonth() + 1 && p.y === d.getFullYear();
    });
    return {
      label: `Thg ${d.getMonth() + 1}`,
      income: inMonth.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0),
      expense: inMonth.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0)
    };
  });
  const max = Math.max(1, ...series.flatMap((x) => [x.income, x.expense]));
  const point = (i, v) => `${Math.round(i * 720 / 5)} ${Math.round(228 - v / max * 208)}`;
  const path = (key) => series.map((x, i) => `${i ? "L" : "M"}${point(i, x[key])}`).join(" ");
  const [ix, iy] = point(5, series[5].income).split(" ");
  const [ex, ey] = point(5, series[5].expense).split(" ");
  return <div className="chart-wrap"><div className="chart-y">{[1, 0.75, 0.5, 0.25, 0].map((f) => <span key={f}>{fmtShort(max * f)}</span>)}</div><svg viewBox="0 0 720 260" role="img" aria-label="Biểu đồ thu nhập và chi tiêu sáu tháng"><g className="grid-lines"><path d="M0 20H720M0 72H720M0 124H720M0 176H720M0 228H720" /></g><path className="income-line" d={path("income")} /><path className="expense-line" d={path("expense")} /><g className="dots"><circle cx={ix} cy={iy} r="6" /><circle cx={ex} cy={ey} r="6" /></g></svg><div className="chart-x">{series.map((x) => <span key={x.label}>{x.label}</span>)}</div><div className="legend"><span><i className="bg-primary" />Thu nhập</span><span><i className="bg-clay" />Chi tiêu</span></div></div>;
}
function Donut({ transactions }) {
  const byCat = new Map();
  transactions.filter((t) => t.type === "expense").forEach((t) => byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount));
  const total = [...byCat.values()].reduce((a, b) => a + b, 0);
  if (!total) return <EmptyState text="Chưa có khoản chi nào." />;
  const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3);
  const rest = sorted.slice(3).reduce((a, [, v]) => a + v, 0);
  const rows = [...top, ...rest ? [["Khác", rest]] : []];
  const colors = ["olive", "sage", "lavender", "clay"];
  let acc = 0;
  const stops = rows.map(([, v], i) => {
    const from = acc;
    acc += v / total * 100;
    return `var(--${colors[i]}) ${from}% ${acc}%`;
  }).join(",");
  return <div className="flex flex-col items-center gap-6 py-4 sm:flex-row sm:justify-center"><div className="donut" style={{ background: `conic-gradient(${stops})` }}><div><small>Đã chi</small><strong>{fmtShort(total)}</strong></div></div><div className="space-y-3 text-sm">{rows.map(([a, v], i) => <div className="flex w-36 justify-between" key={a}><span className="flex items-center gap-2"><i className={cn("dot", `dot-${colors[i]}`)} />{a}</span><b>{Math.round(v / total * 100)}%</b></div>)}</div></div>;
}
function TransactionTable({ items, editable, onRemove }) {
  return <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Giao dịch</th><th>Danh mục</th><th>Ngày</th><th className="text-right">Số tiền</th>{editable && <th />}</tr></thead><tbody>{items.map((t) => <tr key={t.id}><td><div className="flex items-center gap-3"><span className={cn("transaction-icon", t.type === "income" ? "bg-sage text-primary" : "bg-peach text-clay")}>{t.type === "income" ? <ArrowDownLeft /> : <CreditCard />}</span><b>{t.title}</b></div></td><td><span className="tag">{t.category}</span></td><td className="text-muted-foreground">{t.date}</td><td className={cn("text-right font-semibold", t.type === "income" ? "text-success" : "text-foreground")}>{t.type === "income" ? "+" : "−"}{money(t.amount)}</td>{editable && <td><div className="flex justify-end"><Button variant="ghost" size="icon-sm" aria-label="Sửa"><Pencil /></Button><Button variant="ghost" size="icon-sm" onClick={() => onRemove?.(t.id)} aria-label="Xóa"><Trash2 /></Button></div></td>}</tr>)}</tbody></table>{!items.length && <p className="py-14 text-center text-muted-foreground">Không tìm thấy giao dịch phù hợp.</p>}</div>;
}
function Categories({ transactions }) {
  const counts = new Map();
  transactions.forEach((t) => counts.set(t.category, (counts.get(t.category) ?? 0) + 1));
  const tones = ["sage", "sand", "lavender", "peach", "clay"];
  const cats = [...counts.entries()];
  return <><div className="flex flex-wrap items-end justify-between gap-4"><PageTitle eyebrow="Phân loại dòng tiền" title="Danh mục" text="Sắp xếp giao dịch để bạn luôn biết tiền đi đâu." /><Button><Plus />Thêm danh mục</Button></div>{cats.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cats.map(([name, count], i) => <article className="category-card" key={name}><span className={cn("category-mark", `bg-${tones[i % tones.length]}`)}><FolderKanban /></span><div className="min-w-0 flex-1"><h3>{name}</h3><p>{count} giao dịch</p></div><Button variant="ghost" size="icon-sm"><Pencil /></Button></article>)}</div> : <div className="panel"><EmptyState text="Chưa có danh mục nào. Danh mục sẽ xuất hiện khi bạn thêm giao dịch." /></div>}</>;
}
function Budgets() {
  return <><div className="flex flex-wrap items-end justify-between gap-4"><PageTitle eyebrow="Kế hoạch chi tiêu" title="Ngân sách" text="Giữ chi tiêu trong tầm kiểm soát bằng các giới hạn rõ ràng." /><Button><Plus />Tạo ngân sách</Button></div><div className="panel"><EmptyState text="Bạn chưa tạo ngân sách nào." /></div></>;
}
function Reports({ income, expense, transactions }) {
  const rate = income > 0 ? Math.round((income - expense) / income * 100) : 0;
  return <><div className="flex flex-wrap items-end justify-between gap-4"><PageTitle eyebrow="Phân tích tài chính" title="Báo cáo" text="Nhìn lại thói quen để đưa ra quyết định tốt hơn." /><Button variant="outline">6 tháng gần nhất <ChevronDown /></Button></div><div className="mb-6 grid gap-4 sm:grid-cols-3"><Stat label="Tổng thu" value={money(income)} note="Tất cả giao dịch" tone="sage" icon={<TrendingUp />} /><Stat label="Tổng chi" value={money(expense)} note="Tất cả giao dịch" tone="peach" icon={<TrendingDown />} /><Stat label="Tỷ lệ tiết kiệm" value={`${rate}%`} note={income > 0 ? "So với tổng thu nhập" : "Chưa có thu nhập"} tone="lavender" icon={<PiggyBank />} /></div><div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]"><div className="panel"><div className="panel-head"><div><h2>Xu hướng thu – chi</h2><p>So sánh theo từng tháng</p></div></div><LineChart transactions={transactions} /></div><div className="panel"><div className="panel-head"><div><h2>Chi tiêu theo danh mục</h2><p>Tỷ trọng các khoản chi</p></div></div><Donut transactions={transactions} /></div></div></>;
}

export default DashboardPage;
