import { useEffect, useState } from "react";
import { BookOpenText, GraduationCap, Pencil, Plus, Search, UserRound, X } from "lucide-react";
import { EmptyState, ExportExcelButton, PageHeading } from "../../components/ui/index.jsx";
import { initials } from "../../utils/formatters.js";

export function StudentsPage({
  students,
  topics = [],
  lecturers = [],
  onAdd,
  onEdit,
}) {
  const [query, setQuery] = useState("");
  const [major, setMajor] = useState("ALL");
  const [academicYear, setAcademicYear] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const studentAssignments = selectedStudent
    ? topics.flatMap((topic) =>
        (topic.student_assignments || [])
          .filter(
            (assignment) =>
              String(assignment.student_id) === String(selectedStudent.id)
              && assignment.status === "ACTIVE",
          )
          .map((assignment) => {
            const lecturer = lecturers.find(
              (item) =>
                String(item.id) === String(assignment.lecturer_id || topic.lecturer),
            );
            return {
              ...assignment,
              topic,
              lecturerName:
                assignment.lecturer_name || lecturer?.full_name || topic.lecturer_name,
            };
          }),
      )
    : [];
  const majors = [...new Set(students.map((student) => student.major_name).filter(Boolean))];
  const academicYears = [
    ...new Map(
      students
        .filter((student) => student.academic_year != null && student.academic_year_name)
        .map((student) => [String(student.academic_year), student.academic_year_name]),
    ),
  ].sort((first, second) => second[1].localeCompare(first[1], "vi", { numeric: true }));
  const filtered = students.filter((student) => {
    const matches = [
      student.full_name,
      student.student_code,
      student.email,
      student.class_name,
      student.cohort_name,
      student.academic_year_name,
    ]
      .filter(Boolean).some((value) => value.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")));
    const matchesYear = academicYear === "ALL"
      || (academicYear === "UNASSIGNED" && student.academic_year == null)
      || String(student.academic_year) === academicYear;
    return matches
      && matchesYear
      && (major === "ALL" || student.major_name === major);
  });

  useEffect(() => {
    if (!selectedStudent) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedStudent(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStudent]);

  const exportColumns = [
    ["ID sinh viên", (student) => student.id],
    ["Mã sinh viên", (student) => student.student_code],
    ["Họ và tên", (student) => student.full_name],
    ["Email", (student) => student.email],
    ["Số điện thoại", (student) => student.phone],
    ["Ngày sinh", (student) => student.date_of_birth],
    ["Giới tính", (student) => student.gender],
    ["ID khóa học", (student) => student.cohort],
    ["Tên khóa học", (student) => student.cohort_name],
    ["ID ngành", (student) => student.major],
    ["Tên ngành", (student) => student.major_name],
    ["Lớp", (student) => student.class_name],
    ["Trạng thái", (student) => student.status],
    ["ID năm học", (student) => student.academic_year],
    ["Tên năm học", (student) => student.academic_year_name],
  ];
  return (
    <div className="animate-in space-y-5">
      <PageHeading
        eyebrow="UC-BM-10"
        title="Quản lý sinh viên"
        description="Danh sách sinh viên thuộc bộ môn và thông tin học tập."
        action={
          <div className="flex flex-wrap gap-2">
            <ExportExcelButton
              fileName="danh-sach-sinh-vien"
              sheetName="Sinh vien"
              columns={exportColumns}
              rows={filtered}
            />
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <Plus size={17} />
              Thêm sinh viên
            </button>
          </div>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative flex-1 sm:max-w-md"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, mã sinh viên, lớp..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" /></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select aria-label="Lọc theo năm học" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-brand">
              <option value="ALL">Tất cả năm học</option>
              {academicYears.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              {students.some((student) => student.academic_year == null) && <option value="UNASSIGNED">Chưa gán năm học</option>}
            </select>
            <select aria-label="Lọc theo ngành" value={major} onChange={(event) => setMajor(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-brand"><option value="ALL">Tất cả ngành</option>{majors.map((name) => <option key={name}>{name}</option>)}</select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Sinh viên</th><th className="px-4 py-3">Mã sinh viên</th><th className="px-4 py-3">Ngành / lớp</th><th className="px-4 py-3">Khóa học</th><th className="px-4 py-3">Năm học</th><th className="px-4 py-3">Email</th><th className="px-5 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((student) => <tr key={student.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(student)}
                    className="flex items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label={`Xem giảng viên hướng dẫn và đề tài của ${student.full_name}`}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600">{initials(student.full_name)}</div>
                    <span className="text-sm font-semibold text-ink hover:text-brand">{student.full_name}</span>
                  </button>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-slate-600">{student.student_code}</td>
                <td className="px-4 py-3.5"><div className="text-xs font-medium text-slate-700">{student.major_name || "—"}</div><div className="mt-1 text-[10px] text-slate-400">{student.class_name || student.cohort_name || "—"}</div></td>
                <td className="px-4 py-3.5 text-xs text-slate-600">{student.cohort_name || "—"}</td>
                <td className="px-4 py-3.5 text-xs text-slate-600">{student.academic_year_name || "Chưa gán"}</td>
                <td className="px-4 py-3.5 text-xs text-slate-500">{student.email || "—"}</td>
                <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${student.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{student.status === "ACTIVE" ? "Đang học" : student.status || "—"}</span></td>
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onEdit(student)}
                    title={`Sửa hồ sơ ${student.full_name}`}
                    aria-label={`Sửa hồ sơ ${student.full_name}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand"
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {!filtered.length && <EmptyState icon={GraduationCap} title="Không có sinh viên phù hợp" description="Thay đổi nội dung tìm kiếm hoặc bộ lọc." />}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Hiển thị {filtered.length} sinh viên</div>
      </div>
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedStudent(null);
          }}
        >
          <section
            aria-labelledby="student-advising-title"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-indigo-50 font-bold text-indigo-600">
                  {initials(selectedStudent.full_name)}
                </div>
                <div>
                  <div className="text-xs font-medium text-brand">GIẢNG VIÊN VÀ ĐỀ TÀI</div>
                  <h2 id="student-advising-title" className="mt-1 text-lg font-bold text-ink">
                    {selectedStudent.full_name}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {selectedStudent.student_code} · {studentAssignments.length} phân công đang hoạt động
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng thông tin hướng dẫn"
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {studentAssignments.length ? (
              <div className="mt-5 space-y-3">
                {studentAssignments.map((assignment) => (
                  <div
                    key={`${assignment.topic.id}-${assignment.student_id}`}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700">
                        <BookOpenText size={17} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-5 text-ink">
                          {assignment.topic.title}
                        </h3>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {[assignment.topic.topic_code, assignment.academic_year_name || assignment.topic.academic_year_name]
                            .filter(Boolean)
                            .join(" · ") || "Chưa có mã đề tài"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 text-xs">
                      <UserRound className="mt-0.5 shrink-0 text-slate-400" size={15} />
                      <div>
                        <div className="text-[10px] text-slate-400">Giảng viên hướng dẫn</div>
                        <div className="mt-0.5 font-medium text-slate-700">
                          {assignment.lecturerName || "Chưa phân công giảng viên"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpenText}
                title="Chưa có đề tài đang được hướng dẫn"
                description="Sinh viên này chưa có phân công ACTIVE trong bảng topic_students."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
