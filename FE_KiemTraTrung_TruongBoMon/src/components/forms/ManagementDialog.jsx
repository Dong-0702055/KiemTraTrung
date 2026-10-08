import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { Field } from "../ui/index.jsx";

export function ManagementDialog({ dialog, departments, onClose, onSubmit }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [form, setForm] = useState(() => dialog.type === "lecturer" ? {
    lecturer_code: dialog.lecturer?.lecturer_code || "",
    full_name: dialog.lecturer?.full_name || "",
    email: dialog.lecturer?.email || "",
    phone: dialog.lecturer?.phone || "",
    academic_degree: dialog.lecturer?.academic_degree || "",
    specialization: dialog.lecturer?.specialization || "",
    is_active: dialog.lecturer?.is_active ?? true,
    department: String(dialog.lecturer?.department || ""),
    ...(dialog.lecturer ? {} : { user_id: "" }),
  } : {
    code: dialog.field?.code || "",
    name: dialog.field?.name || "",
    description: dialog.field?.description || "",
    department: dialog.field?.department || "",
  });
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const decisionLabel = {
    APPROVE: "Phê duyệt đề tài",
    REJECT: "Từ chối đề tài",
    REQUEST_REVISION: "Yêu cầu chỉnh sửa",
  }[dialog.decision];
  const title = dialog.type === "review" ? decisionLabel
    : dialog.type === "lecturer" ? dialog.lecturer ? "Cập nhật giảng viên" : "Thêm giảng viên"
      : dialog.type === "delete-field" ? "Xóa danh mục"
        : dialog.field ? "Cập nhật danh mục" : "Thêm danh mục";

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (dialog.type === "review") await onSubmit({ comment });
      else if (dialog.type === "delete-field") await onSubmit({});
      else {
        const body = { ...form };
        if (dialog.type === "lecturer") {
          body.user_id = body.user_id ? Number(body.user_id) : undefined;
          body.department = body.department ? Number(body.department) : undefined;
          if (body.user_id === undefined) delete body.user_id;
          if (body.department === undefined) delete body.department;
        } else body.department = body.department ? Number(body.department) : undefined;
        await onSubmit(body);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form onSubmit={submit} className="animate-in w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><h2 className="font-bold text-ink">{title}</h2>{dialog.topic && <div className="mt-1 max-w-sm truncate text-xs text-slate-400">{dialog.topic.title}</div>}</div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">
          {dialog.type === "review" && (
            <>
              <div className={`rounded-xl p-3 text-sm ${
                dialog.decision === "APPROVE" ? "bg-emerald-50 text-emerald-800" :
                dialog.decision === "REJECT" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"
              }`}>
                {dialog.decision === "APPROVE" ? "Đề tài sẽ được chuyển sang trạng thái Đã duyệt." :
                  dialog.decision === "REJECT" ? "Đề tài sẽ bị từ chối." :
                    "Đề tài sẽ được chuyển lại để sinh viên/giảng viên chỉnh sửa."}
              </div>
              <label className="block text-sm font-medium text-slate-700">Nhận xét {dialog.decision === "REQUEST_REVISION" && <span className="text-rose-600">*</span>}
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} required={dialog.decision === "REQUEST_REVISION"} rows={4} placeholder="Nhập nhận xét hoặc nội dung cần chỉnh sửa..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-teal-50" />
              </label>
            </>
          )}
          {dialog.type === "lecturer" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mã giảng viên" value={form.lecturer_code} onChange={(value) => setValue("lecturer_code", value)} required />
              <Field label="Họ và tên" value={form.full_name} onChange={(value) => setValue("full_name", value)} required />
              <Field label="Email" type="email" value={form.email} onChange={(value) => setValue("email", value)} />
              <Field label="Số điện thoại" value={form.phone} onChange={(value) => setValue("phone", value)} />
              <Field label="Học vị" value={form.academic_degree} onChange={(value) => setValue("academic_degree", value)} />
              {!dialog.lecturer && <Field label="ID tài khoản người dùng" value={form.user_id} onChange={(value) => setValue("user_id", value)} type="number" hint="Backend yêu cầu user_id để tạo giảng viên." />}
              <label className="block text-sm font-medium text-slate-700">Bộ môn<span className="ml-1 text-rose-600">*</span>
                <select required value={form.department} onChange={(event) => setValue("department", event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand">
                  <option value="">Chọn bộ môn</option>
                  {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Chuyên môn
                <textarea value={form.specialization} onChange={(event) => setValue("specialization", event.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              {dialog.lecturer && <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => setValue("is_active", event.target.checked)} className="accent-teal-700" />Đang công tác</label>}
            </div>
          )}
          {dialog.type === "field" && (
            <div className="space-y-4">
              <Field label="Mã danh mục" value={form.code} onChange={(value) => setValue("code", value)} required />
              <Field label="Tên ngành / lĩnh vực" value={form.name} onChange={(value) => setValue("name", value)} required />
              <label className="block text-sm font-medium text-slate-700">Mô tả
                <textarea value={form.description} onChange={(event) => setValue("description", event.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Bộ môn<span className="ml-1 text-rose-600">*</span>
                <select required value={form.department} onChange={(event) => setValue("department", event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand">
                  <option value="">Chọn bộ môn</option>
                  {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <span className="mt-1 block text-[10px] font-normal text-slate-400">Danh mục được lưu vào API ngành học (/majors/).</span>
              </label>
            </div>
          )}
          {dialog.type === "delete-field" && <p className="text-sm leading-6 text-slate-600">Bạn có chắc muốn xóa danh mục <strong>{dialog.field.name}</strong>? Thao tác này có thể bị backend từ chối nếu danh mục đang được sử dụng.</p>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          {dialog.type === "review" && !comment.trim() && dialog.decision === "REQUEST_REVISION" && <div className="text-xs text-slate-400">Hãy ghi rõ nội dung cần chỉnh sửa trước khi gửi yêu cầu.</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
          <button disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {submitting && <LoaderCircle size={15} className="animate-spin" />}
            {dialog.type === "review" ? "Gửi quyết định" : dialog.type === "delete-field" ? "Xác nhận xóa" : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
