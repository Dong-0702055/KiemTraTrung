import { Download, X } from "lucide-react";
import { statusClasses, statusLabels } from "../../constants/topics.js";
import { exportExcel } from "../../utils/exportExcel.js";
export { ScreenErrorBoundary } from "./ScreenErrorBoundary.jsx";

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="text-sm font-medium text-brand">{eyebrow}</div><h2 className="mt-1 text-2xl font-bold text-ink">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{action}</div>;
}

export function ExportExcelButton({ fileName, sheetName, columns, rows }) {
  return (
    <button
      type="button"
      onClick={() => exportExcel({ fileName, sheetName, columns, rows })}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
    >
      <Download size={17} />
      Xuất Excel
    </button>
  );
}

export function Field({ label, value, onChange, type = "text", required = false, hint = "" }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{required && <span className="ml-1 text-rose-600">*</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-teal-50" />{hint && <span className="mt-1 block text-[10px] font-normal text-slate-400">{hint}</span>}</label>;
}

export function Detail({ label, value }) {
  return <div><div className="text-[11px] font-medium text-slate-400">{label}</div><div className="mt-1 text-sm font-medium text-slate-700">{value}</div></div>;
}

export function StatusBadge({ status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClasses[status] || "bg-slate-100 text-slate-600"}`}>{statusLabels[status] || status || "—"}</span>;
}

export function EmptyState({ icon: Icon, title, description }) {
  return <div className="grid justify-items-center px-5 py-12 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon size={21} /></div><div className="mt-3 text-sm font-semibold text-slate-700">{title}</div><div className="mt-1 max-w-sm text-xs leading-5 text-slate-400">{description}</div></div>;
}

export function Toast({ notice, onClose }) {
  return <div role="status" className={`fixed bottom-5 right-5 z-[60] flex max-w-[min(92vw,440px)] items-start gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-xl ${notice.type === "error" ? "bg-rose-700" : "bg-slate-900"}`}><span className="flex-1">{notice.message}</span><button onClick={onClose} aria-label="Đóng thông báo"><X size={16} /></button></div>;
}
