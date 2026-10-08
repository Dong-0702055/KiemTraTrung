import { useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-teal-50";

const statusOptions = [
  ["ACTIVE", "Đang học"],
  ["GRADUATED", "Đã tốt nghiệp"],
  ["SUSPENDED", "Tạm dừng"],
  ["DROPPED_OUT", "Đã thôi học"],
];

function SelectField({ label, value, onChange, children, required = false }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-rose-600">*</span>}
      <select
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {children}
      </select>
    </label>
  );
}

export function StudentDialog({
  student,
  majors,
  cohorts,
  academicYears,
  onClose,
  onSubmit,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    student_code: student?.student_code || "",
    full_name: student?.full_name || "",
    email: student?.email || "",
    phone: student?.phone || "",
    date_of_birth: student?.date_of_birth || "",
    gender: student?.gender || "",
    major: student?.major == null ? "" : String(student.major),
    cohort: student?.cohort == null ? "" : String(student.cohort),
    academic_year:
      student?.academic_year == null ? "" : String(student.academic_year),
    class_name: student?.class_name || "",
    status: student?.status || "ACTIVE",
  }));
  const matchingCohorts = cohorts.filter(
    (cohort) => String(cohort.major) === form.major,
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        student_code: form.student_code.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender.trim(),
        major: Number(form.major),
        cohort: Number(form.cohort),
        academic_year: form.academic_year ? Number(form.academic_year) : null,
        class_name: form.class_name.trim(),
        status: form.status,
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="animate-in max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="font-bold text-ink">
              {student ? "Cập nhật hồ sơ sinh viên" : "Thêm sinh viên"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Chỉ tạo hồ sơ học tập, không tạo tài khoản đăng nhập.
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

        <div className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Mã sinh viên<span className="ml-1 text-rose-600">*</span>
              <input
                className={inputClass}
                value={form.student_code}
                onChange={(event) => setValue("student_code", event.target.value)}
                maxLength={30}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Họ và tên<span className="ml-1 text-rose-600">*</span>
              <input
                className={inputClass}
                value={form.full_name}
                onChange={(event) => setValue("full_name", event.target.value)}
                maxLength={255}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(event) => setValue("email", event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Số điện thoại
              <input
                className={inputClass}
                value={form.phone}
                onChange={(event) => setValue("phone", event.target.value)}
                maxLength={20}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Ngày sinh
              <input
                className={inputClass}
                type="date"
                value={form.date_of_birth}
                onChange={(event) => setValue("date_of_birth", event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Giới tính
              <input
                className={inputClass}
                value={form.gender}
                onChange={(event) => setValue("gender", event.target.value)}
                maxLength={30}
              />
            </label>
            <SelectField
              label="Ngành"
              value={form.major}
              required
              onChange={(value) => {
                setValue("major", value);
                if (!cohorts.some(
                  (cohort) =>
                    String(cohort.id) === form.cohort
                    && String(cohort.major) === value,
                )) {
                  setValue("cohort", "");
                }
              }}
            >
              <option value="">Chọn ngành</option>
              {majors.map((major) => (
                <option key={major.id} value={major.id}>
                  {major.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Khóa học"
              value={form.cohort}
              required
              onChange={(value) => setValue("cohort", value)}
            >
              <option value="">Chọn khóa học</option>
              {matchingCohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name} ({cohort.code})
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Năm học"
              value={form.academic_year}
              onChange={(value) => setValue("academic_year", value)}
            >
              <option value="">Chưa gán năm học</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </SelectField>
            <label className="block text-sm font-medium text-slate-700">
              Lớp
              <input
                className={inputClass}
                value={form.class_name}
                onChange={(event) => setValue("class_name", event.target.value)}
                maxLength={100}
              />
            </label>
            <SelectField
              label="Trạng thái"
              value={form.status}
              onChange={(value) => setValue("status", value)}
            >
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting && <LoaderCircle className="animate-spin" size={16} />}
            {student ? "Lưu thay đổi" : "Thêm sinh viên"}
          </button>
        </div>
      </form>
    </div>
  );
}
