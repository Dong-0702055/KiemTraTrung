import { useEffect, useState } from "react";
import { BookOpenText, GraduationCap, Plus, Search, Settings2, Users, UsersRound, X } from "lucide-react";
import { EmptyState, ExportExcelButton, PageHeading } from "../../components/ui/index.jsx";
import { initials } from "../../utils/formatters.js";

export function LecturersPage({ lecturers, topics = [], onAdd, onEdit }) {
  const [query, setQuery] = useState("");
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const filtered = lecturers.filter((lecturer) =>
    [lecturer.full_name, lecturer.lecturer_code, lecturer.email, lecturer.specialization]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))),
  );
  const assignmentsByTopic = selectedLecturer
    ? topics
        .map((topic) => ({
          ...topic,
          students: (topic.student_assignments || []).filter(
            (assignment) =>
              String(assignment.lecturer_id) === String(selectedLecturer.id)
              && assignment.status === "ACTIVE",
          ),
        }))
        .filter((topic) => topic.students.length > 0)
    : [];
  const assignedStudentCount = assignmentsByTopic.reduce(
    (count, topic) => count + topic.students.length,
    0,
  );

  useEffect(() => {
    if (!selectedLecturer) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedLecturer(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLecturer]);

  const exportColumns = [
    ["Mã giảng viên", (lecturer) => lecturer.lecturer_code],
    ["Họ và tên", (lecturer) => lecturer.full_name],
    ["Email", (lecturer) => lecturer.email],
    ["Số điện thoại", (lecturer) => lecturer.phone],
    ["Bộ môn", (lecturer) => lecturer.department_name],
    ["Học vị", (lecturer) => lecturer.academic_degree],
    ["Chuyên môn", (lecturer) => lecturer.specialization],
    ["Trạng thái", (lecturer) => lecturer.is_active === false ? "Đã khóa" : "Đang công tác"],
  ];
  return (
    <div className="animate-in space-y-5">
      <PageHeading eyebrow="UC-BM-09" title="Quản lý giảng viên" description="Thông tin giảng viên thuộc bộ môn." action={<div className="flex flex-wrap gap-2"><ExportExcelButton fileName="danh-sach-giang-vien" sheetName="Giang vien" columns={exportColumns} rows={filtered} /><button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Plus size={17} />Thêm giảng viên</button></div>} />
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:flex-row">
        <div className="relative max-w-lg flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, mã giảng viên, email..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" /></div>
        <div className="flex items-center text-xs text-slate-400"><Users size={15} className="mr-2" />{filtered.length} giảng viên</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((lecturer) => (
          <article key={lecturer.id} className="relative rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
            <button
              type="button"
              onClick={() => setSelectedLecturer(lecturer)}
              className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={`Xem sinh viên và đề tài ${lecturer.full_name} đang hướng dẫn`}
            >
              <div className="flex items-start justify-between pr-9">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-100 font-bold text-brand">{initials(lecturer.full_name)}</div>
                  <div><h3 className="text-sm font-bold text-ink">{lecturer.full_name}</h3><div className="mt-1 text-xs text-slate-400">{lecturer.lecturer_code}</div></div>
                </div>
              </div>
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div>{lecturer.email || "Chưa cập nhật email"}</div>
                <div>{lecturer.phone || "Chưa cập nhật số điện thoại"}</div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="truncate">{lecturer.academic_degree || "Chưa cập nhật học vị"}</span>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${lecturer.is_active === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
                    {lecturer.is_active === false ? "Đã khóa" : "Đang công tác"}
                  </span>
                </div>
                {lecturer.specialization && <div className="line-clamp-2 text-slate-400">{lecturer.specialization}</div>}
                <div className="pt-1 text-[11px] font-semibold text-brand">Xem sinh viên và đề tài đang hướng dẫn</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onEdit(lecturer)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand"
              title="Sửa thông tin"
              aria-label={`Sửa thông tin ${lecturer.full_name}`}
            >
              <Settings2 size={17} />
            </button>
          </article>
        ))}
        {!filtered.length && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-12"><EmptyState icon={UsersRound} title="Chưa có giảng viên" description="Dữ liệu giảng viên sẽ xuất hiện sau khi tải từ backend." /></div>}
      </div>
      {selectedLecturer && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLecturer(null);
          }}
        >
          <section
            aria-labelledby="lecturer-assignments-title"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 font-bold text-brand">
                  {initials(selectedLecturer.full_name)}
                </div>
                <div>
                  <div className="text-xs font-medium text-brand">PHÂN CÔNG HƯỚNG DẪN</div>
                  <h2 id="lecturer-assignments-title" className="mt-1 text-lg font-bold text-ink">
                    {selectedLecturer.full_name}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {assignedStudentCount} sinh viên · {assignmentsByTopic.length} đề tài đang hướng dẫn
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng danh sách phân công"
                onClick={() => setSelectedLecturer(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {assignmentsByTopic.length ? (
              <div className="mt-5 space-y-3">
                {assignmentsByTopic.map((topic) => (
                  <div key={topic.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700">
                        <BookOpenText size={17} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-5 text-ink">{topic.title}</h3>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {[topic.topic_code, topic.academic_year_name].filter(Boolean).join(" · ") || "Chưa có mã đề tài"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      {topic.students.map((assignment) => (
                        <div key={assignment.student_id} className="flex items-start gap-2 text-xs">
                          <GraduationCap className="mt-0.5 shrink-0 text-slate-400" size={15} />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-700">{assignment.student_name}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {[assignment.student_code, assignment.academic_year_name].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            Đang hướng dẫn
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="Chưa có phân công hướng dẫn đang hoạt động"
                description="Chưa có sinh viên nào được gán cho giảng viên này trong bảng phân công đề tài."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
