import { fmtDateOnly, money } from "@/lib/format";

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function buildHtml(report, range) {
  const { totalIncome, totalExpense, savingRate } = report.summary;
  const balance = totalIncome - totalExpense;
  const rows = report.items.length
    ? report.items
        .map(
          (x) =>
            `<tr><td>${esc(x.type)}</td><td>${esc(x.category)}</td><td>${fmtDateOnly(x.date)}</td><td class="num">${x.amount < 0 ? "−" : "+"}${money(Math.abs(x.amount))}</td><td>${esc(x.note)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="5" class="empty">Không có giao dịch trong khoảng thời gian đã chọn.</td></tr>`;

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Báo cáo thu – chi</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #2b2a26; font-size: 12px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p.meta { margin: 0 0 16px; color: #6b665a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th, td { border: 1px solid #cfc8b6; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #efeadc; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.empty { text-align: center; color: #6b665a; }
</style></head><body>
<h1>Báo cáo thu – chi</h1>
<p class="meta">Khoảng thời gian: ${fmtDateOnly(range.start)} – ${fmtDateOnly(range.end)} · Xuất lúc ${esc(new Date(report.generatedAt).toLocaleString("vi-VN"))}</p>
<table><thead><tr><th>Tổng thu</th><th>Tổng chi</th><th>Số dư</th><th>Tỷ lệ tiết kiệm</th></tr></thead>
<tbody><tr><td>${money(totalIncome)}</td><td>${money(totalExpense)}</td><td>${balance < 0 ? "−" : ""}${money(Math.abs(balance))}</td><td>${savingRate}%</td></tr></tbody></table>
<table><thead><tr><th>Loại</th><th>Danh mục</th><th>Ngày</th><th class="num">Số tiền</th><th>Ghi chú</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

// Backend trả dữ liệu chuẩn hóa cho PDF; trình duyệt in ra PDF qua hộp thoại "In → Lưu dưới dạng PDF".
// Dùng iframe ẩn thay vì cửa sổ mới để không bị chặn pop-up.
export function printReport(report, range) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
    const cleanup = () => iframe.remove();
    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        win.onafterprint = cleanup;
        win.focus();
        win.print();
        window.setTimeout(cleanup, 60000);
        resolve();
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    iframe.srcdoc = buildHtml(report, range);
    document.body.appendChild(iframe);
  });
}
