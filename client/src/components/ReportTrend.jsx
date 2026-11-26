import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import { getDashboardChart } from "@/services/dashboardService";

// US-32: đơn vị thời gian do backend hỗ trợ — week (7 ngày gần nhất, theo ngày) và month (6 tháng gần nhất, theo tháng)
const PERIODS = [
  { key: "week", label: "Tuần", hint: "Theo ngày, 7 ngày gần nhất" },
  { key: "month", label: "Tháng", hint: "Theo tháng, 6 tháng gần nhất" },
];

const fmtShort = (v) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(/\.0$/, "").replace(".", ",")}tr` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(Math.round(v));

function Chart({ series }) {
  const last = series.length - 1;
  const max = Math.max(1, ...series.flatMap((x) => [x.income, x.expense]));
  const x = (i) => Math.round((i * 720) / last);
  const y = (v) => Math.round(228 - (v / max) * 208);
  const path = (key) => series.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p[key])}`).join(" ");

  return (
    <div className="chart-wrap">
      <div className="chart-y">{[1, 0.75, 0.5, 0.25, 0].map((f) => <span key={f}>{fmtShort(max * f)}</span>)}</div>
      <svg viewBox="0 0 720 260" role="img" aria-label="Biểu đồ biến động thu nhập và chi tiêu theo thời gian">
        <g className="grid-lines"><path d="M0 20H720M0 72H720M0 124H720M0 176H720M0 228H720" /></g>
        <path className="income-line" d={path("income")} />
        <path className="expense-line" d={path("expense")} />
        {series.map((p, i) => (
          <g key={p.label + i}>
            <circle cx={x(i)} cy={y(p.income)} r="5" style={{ fill: "var(--primary)" }}>
              <title>{`${p.label} · Thu nhập: ${money(p.income)}`}</title>
            </circle>
            <circle cx={x(i)} cy={y(p.expense)} r="5" style={{ fill: "var(--clay)" }}>
              <title>{`${p.label} · Chi tiêu: ${money(p.expense)}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="chart-x">{series.map((p, i) => <span key={p.label + i}>{p.label}</span>)}</div>
      <div className="legend"><span><i className="bg-primary" />Thu nhập</span><span><i className="bg-clay" />Chi tiêu</span></div>
    </div>
  );
}

export function ReportTrend() {
  const [period, setPeriod] = useState("month");
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (value) => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardChart(value);
      setSeries(data.series ?? []);
    } catch (err) {
      setSeries([]);
      setError(err.response ? "Không tải được biểu đồ, vui lòng thử lại." : "Không kết nối được máy chủ, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [load, period]);

  const hasData = series.some((p) => p.income > 0 || p.expense > 0);
  const current = PERIODS.find((p) => p.key === period);

  return (
    <div className="panel">
      <div className="panel-head">
        <div><h2>Xu hướng thu – chi</h2><p>{current.hint}</p></div>
        <div className="flex gap-1" role="group" aria-label="Đơn vị thời gian">
          {PERIODS.map((p) => (
            <Button key={p.key} size="sm" variant={period === p.key ? "default" : "outline"} aria-pressed={period === p.key} onClick={() => setPeriod(p.key)}>{p.label}</Button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="py-14 text-center text-muted-foreground">Đang tải biểu đồ…</p>
      ) : error ? (
        <div>
          <p role="alert" className="py-10 text-center text-clay">{error}</p>
          <div className="flex justify-center"><Button variant="outline" onClick={() => load(period)}>Thử lại</Button></div>
        </div>
      ) : hasData ? (
        <Chart series={series} />
      ) : (
        <p className={cn("py-14 text-center text-muted-foreground")}>Không có dữ liệu trong khoảng thời gian đã chọn.</p>
      )}
    </div>
  );
}
