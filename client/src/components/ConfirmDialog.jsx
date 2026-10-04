import { Button } from "@/components/ui/button";

export function ConfirmDialog({ title, children, confirmText = "Xóa", busy, error, onConfirm, onCancel }) {
  return <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-label={title}><div className="modal"><h2 className="font-display text-3xl">{title}</h2><div className="mt-3 text-sm text-muted-foreground">{children}</div>{error && <p role="alert" className="mt-4 rounded-lg bg-peach px-4 py-3 text-sm font-medium text-clay">{error}</p>}<div className="mt-7 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Hủy</Button><Button type="button" variant="danger" onClick={onConfirm} disabled={busy}>{busy ? "Đang xử lý…" : confirmText}</Button></div></div></div>;
}
