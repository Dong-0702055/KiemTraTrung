import { useState } from "react";
import { ClipboardList, FilePenLine, Plus, Search, XCircle } from "lucide-react";
import { EmptyState, ExportExcelButton, PageHeading } from "../../components/ui/index.jsx";

export function FieldsPage({ fields, onAdd, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const filtered = fields.filter((field) =>
    [field.name, field.code, field.description, field.department_name]
      .filter(Boolean).some((value) => value.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))),
  );
  const exportColumns = [
    ["Mã danh mục", (field) => field.code],
    ["Tên ngành / lĩnh vực", (field) => field.name],
    ["Bộ môn", (field) => field.department_name],
    ["Mô tả", (field) => field.description],
  ];
  return (
    <div className="animate-in space-y-5">
      <PageHeading eyebrow="UC-BM-11" title="Danh mục / lĩnh vực" description="Quản lý danh mục ngành và các lĩnh vực đề tài." action={<div className="flex flex-wrap gap-2"><ExportExcelButton fileName="danh-sach-danh-muc" sheetName="Danh muc" columns={exportColumns} rows={filtered} /><button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Plus size={17} />Thêm danh mục</button></div>} />
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative flex-1 sm:max-w-md"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã, tên danh mục..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" /></div>
          <div className="text-xs text-slate-400">{filtered.length} danh mục</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Mã</th><th className="px-4 py-3">Tên ngành / lĩnh vực</th><th className="px-4 py-3">Bộ môn</th><th className="px-4 py-3">Mô tả</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((field) => <tr key={field.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4"><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{field.code}</span></td>
                <td className="px-4 py-4 text-sm font-semibold text-ink">{field.name}</td>
                <td className="px-4 py-4 text-xs text-slate-500">{field.department_name || "—"}</td>
                <td className="max-w-[260px] truncate px-4 py-4 text-xs text-slate-500">{field.description || "—"}</td>
                <td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => onEdit(field)} title="Sửa" className="rounded-lg p-2 text-slate-400 hover:bg-teal-50 hover:text-brand"><FilePenLine size={16} /></button><button onClick={() => onDelete(field)} title="Xóa" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><XCircle size={16} /></button></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {!filtered.length && <EmptyState icon={ClipboardList} title="Chưa có danh mục" description="Tạo danh mục đầu tiên để phân loại đề tài." />}
      </div>
    </div>
  );
}
