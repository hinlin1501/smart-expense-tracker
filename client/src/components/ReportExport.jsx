import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportReportExcel, getReportData } from "@/services/dashboardService";
import { printReport } from "@/lib/reportPdf";

const EXPORT_ERROR = "Không thể xuất báo cáo, vui lòng thử lại.";

// US-33: xuất báo cáo (Excel / PDF) theo khoảng thời gian đang chọn
export function ReportExport({ startDate, endDate, disabled, notify }) {
  const [busy, setBusy] = useState(""); // "excel" | "pdf" | ""
  const [error, setError] = useState("");

  const run = async (kind, task) => {
    setBusy(kind);
    setError("");
    try {
      await task();
    } catch {
      setError(EXPORT_ERROR);
    } finally {
      setBusy("");
    }
  };

  const exportExcel = () =>
    run("excel", async () => {
      const blob = await exportReportExcel({ start_date: startDate, end_date: endDate });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bao-cao-thu-chi.xls";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Đã xuất báo cáo Excel");
    });

  const exportPdf = () =>
    run("pdf", async () => {
      const report = await getReportData({ start_date: startDate, end_date: endDate });
      await printReport(report, { start: startDate, end: endDate });
    });

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportExcel} disabled={disabled || !!busy}>
          <FileSpreadsheet />{busy === "excel" ? "Đang xuất…" : "Xuất Excel"}
        </Button>
        <Button variant="outline" onClick={exportPdf} disabled={disabled || !!busy}>
          <FileDown />{busy === "pdf" ? "Đang xuất…" : "Xuất PDF"}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-clay">{error}</p>}
    </div>
  );
}
