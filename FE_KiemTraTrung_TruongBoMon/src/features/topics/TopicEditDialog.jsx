import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { topicCode } from "../../utils/formatters.js";

export function TopicEditDialog({
  topic,
  fields,
  majors = [],
  departments = [],
  lecturers = [],
  academicYears = [],
  semesters = [],
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    topic_code: topic.topic_code || "",
    title: topic.title || "",
    description: topic.description || "",
    keywords: topic.keywords || "",
    field: topic.field || "",
    project_type: topic.project_type || "",
    architecture: topic.architecture || "",
    major: topic.major == null ? "" : String(topic.major),
    department: topic.department == null ? "" : String(topic.department),
    academic_year: topic.academic_year == null ? "" : String(topic.academic_year),
    semester: topic.semester == null ? "" : String(topic.semester),
    lecturer: topic.lecturer == null ? "" : String(topic.lecturer),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "academic_year" && current.semester) {
        const selectedSemester = semesters.find(
          (semester) => String(semester.id) === current.semester,
        );
        if (selectedSemester && String(selectedSemester.academic_year) !== value) {
          next.semester = "";
        }
      }
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        ...form,
        topic_code: form.topic_code.trim() || null,
        major: form.major || null,
        department: form.department || null,
        academic_year: form.academic_year || null,
        semester: form.semester || null,
        lecturer: form.lecturer || null,
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="animate-in w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 pr-4">
            <div className="text-xs font-semibold text-brand">{topicCode(topic)}</div>
            <h2 className="mt-1 text-lg font-bold text-ink">Chỉnh sửa đề tài</h2>
            <p className="mt-1 text-xs text-slate-500">
              Cập nhật thông tin đề tài và phân công theo năm học.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Mã đề tài
              <input
                maxLength={50}
                name="topic_code"
                value={form.topic_code}
                onChange={updateField}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Loại đề tài
              <input
                maxLength={50}
                name="project_type"
                value={form.project_type}
                onChange={updateField}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand"
                placeholder="Ví dụ: Nghiên cứu, ứng dụng..."
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Tên đề tài <span className="text-rose-600">*</span>
            <input
              autoFocus
              required
              maxLength={10000}
              name="title"
              value={form.title}
              onChange={updateField}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-teal-50"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Nội dung / mô tả đề tài
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows={7}
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-brand focus:ring-4 focus:ring-teal-50"
              placeholder="Mô tả mục tiêu, nội dung và phạm vi đề tài..."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Ngành
              <select name="major" value={form.major} onChange={updateField} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand">
                <option value="">Chưa phân ngành</option>
                {majors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Khoa / bộ môn
              <select name="department" value={form.department} onChange={updateField} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand">
                <option value="">Chưa phân khoa</option>
                {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Năm học
              <select name="academic_year" value={form.academic_year} onChange={updateField} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand">
                <option value="">Chưa gán năm học</option>
                {academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Học kỳ
              <select name="semester" value={form.semester} onChange={updateField} disabled={!form.academic_year} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">Chưa chọn học kỳ</option>
                {form.semester && !semesters.some(
                  (item) => String(item.id) === form.semester && String(item.academic_year) === form.academic_year,
                ) && <option value={form.semester}>{topic.semester_name || "Học kỳ hiện tại"}</option>}
                {semesters
                  .filter((item) => String(item.academic_year) === form.academic_year)
                  .map((item) => <option key={item.id} value={item.id}>{item.name || `Học kỳ ${item.semester_number}`}</option>)}
              </select>
              {!form.academic_year && <span className="mt-1 block text-xs font-normal text-slate-400">Chọn năm học trước.</span>}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Giảng viên hướng dẫn
              <select name="lecturer" value={form.lecturer} onChange={updateField} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand">
                <option value="">Chưa phân công</option>
                {lecturers.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Kiến trúc
              <input
                maxLength={100}
                name="architecture"
                value={form.architecture}
                onChange={updateField}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand"
                placeholder="Ví dụ: Microservices, 3-tier..."
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Lĩnh vực
              <select
                name="field"
                value={form.field}
                onChange={updateField}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand"
              >
                <option value="">Chọn lĩnh vực</option>
                {form.field && !fields.some((item) => item.name === form.field) && (
                  <option value={form.field}>{form.field} (giá trị hiện tại)</option>
                )}
                {fields.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              {!fields.length && (
                <span className="mt-1 block text-xs font-normal text-amber-700">
                  Chưa tải được danh mục từ cơ sở dữ liệu.
                </span>
              )}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Từ khóa
              <input
                name="keywords"
                value={form.keywords}
                onChange={updateField}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand"
                placeholder="Phân cách bằng dấu phẩy"
              />
            </label>
          </div>
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting && <LoaderCircle size={15} className="animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
