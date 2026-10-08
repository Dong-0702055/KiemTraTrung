import { useMemo, useState } from "react";
import { ArrowDownUp, BookOpenText, ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Check, FilePenLine, X } from "lucide-react";
import { statusLabels } from "../../constants/topics.js";
import { StatusBadge, EmptyState, ExportExcelButton } from "../../components/ui/index.jsx";
import { formatDate, topicCode } from "../../utils/formatters.js";

const assignmentStatus = {
  ACTIVE: { label: "Đang thực hiện", className: "bg-emerald-50 text-emerald-700" },
  REMOVED: { label: "Đã gỡ", className: "bg-slate-100 text-slate-500" },
  COMPLETED: { label: "Hoàn thành", className: "bg-indigo-50 text-indigo-700" },
};

function matchesAcademicYear(topic, selectedYear) {
  if (selectedYear === "ALL") return true;
  const assignedYears = (topic.student_assignments || [])
    .map((assignment) => assignment.academic_year_id)
    .filter((yearId) => yearId != null)
    .map(String);
  if (selectedYear === "UNASSIGNED") {
    return topic.academic_year == null && assignedYears.length === 0;
  }
  return String(topic.academic_year) === selectedYear || assignedYears.includes(selectedYear);
}

export function TopicsPage({ topics, approvals, academicYears = [], onSelectTopic, onReview, reviewQueueOnly = false }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [academicYear, setAcademicYear] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("vi");
    return topics
      .filter((topic) => !reviewQueueOnly || ["SUBMITTED", "UNDER_REVIEW"].includes(topic.status))
      .filter((topic) => matchesAcademicYear(topic, academicYear))
      .filter((topic) => status === "ALL" || topic.status === status)
      .filter((topic) =>
        !search ||
        [
          topic.title,
          topic.topic_code,
          topic.lecturer_name,
          topic.created_by_name,
          topic.field,
          topic.academic_year_name,
          ...(topic.student_assignments || []).flatMap((assignment) => [
            assignment.student_name,
            assignment.student_code,
            assignment.lecturer_name,
            assignment.academic_year_name,
          ]),
        ]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase("vi").includes(search)),
      )
      .sort((a, b) =>
        sort === "oldest"
          ? new Date(a.created_at || 0) - new Date(b.created_at || 0)
          : new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );
  }, [topics, query, status, sort, academicYear, reviewQueueOnly]);
  const actionable = (topic) => ["SUBMITTED", "UNDER_REVIEW"].includes(topic.status);
  const exportColumns = [
    ["Mã đề tài", (topic) => topicCode(topic)],
    ["Tên đề tài", (topic) => topic.title],
    ["Giảng viên", (topic) => topic.lecturer_name || topic.created_by_name || "Chưa phân công"],
    ["Sinh viên", (topic) => (topic.student_assignments || [])
      .map((student) => `${student.student_name || ""}${student.student_code ? ` (${student.student_code})` : ""}`)
      .filter(Boolean)
      .join(", ") || "Chưa có sinh viên"],
    ["Lĩnh vực", (topic) => topic.field || topic.major_name || ""],
    ["Năm học", (topic) => topic.academic_year_name || topic.student_assignments?.find((student) => student.academic_year_name)?.academic_year_name || ""],
    ["Trạng thái", (topic) => statusLabels[topic.status] || topic.status],
    ["Ngày tạo", (topic) => formatDate(topic.created_at)],
  ];
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageTopics = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const setStatusAndResetPage = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="animate-in space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm font-medium text-brand">
            {reviewQueueOnly ? "UC-BM-07 · UC-BM-08" : "UC-BM-03 · UC-BM-07 · UC-BM-08"}
          </div>
          <h2 className="mt-1 text-2xl font-bold text-ink">
            {reviewQueueOnly ? "Phê duyệt đề tài" : "Quản lý đề tài"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {reviewQueueOnly
              ? "Danh sách đề tài đang chờ xử lý. Chọn duyệt, yêu cầu chỉnh sửa hoặc từ chối."
              : "Tìm kiếm, theo dõi và xử lý đề tài thuộc bộ môn."}
          </p>
        </div>
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-ink">{filtered.length}</span> / {reviewQueueOnly
            ? topics.filter((topic) => ["SUBMITTED", "UNDER_REVIEW"].includes(topic.status)).length
            : topics.length} đề tài
        </div>
        <ExportExcelButton
          fileName={reviewQueueOnly ? "hang-cho-phe-duyet" : "danh-sach-de-tai"}
          sheetName="De tai"
          columns={exportColumns}
          rows={filtered}
        />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, mã, giảng viên, lĩnh vực..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-teal-50"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <select
                aria-label="Lọc theo năm học"
                value={academicYear}
                onChange={(event) => {
                  setAcademicYear(event.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-brand sm:w-48"
              >
                <option value="ALL">Tất cả năm học</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
                {topics.some((topic) => matchesAcademicYear(topic, "UNASSIGNED")) && (
                  <option value="UNASSIGNED">Chưa gán năm học</option>
                )}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </label>
            {!reviewQueueOnly && (
              <label className="relative">
                <SlidersHorizontal size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={status}
                  onChange={(event) => setStatusAndResetPage(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-600 outline-none focus:border-brand sm:w-48"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </label>
            )}
            <button
              onClick={() => setSort((value) => value === "newest" ? "oldest" : "newest")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              <ArrowDownUp size={15} />
              {sort === "newest" ? "Mới nhất" : "Cũ nhất"}
            </button>
          </div>
        </div>
        {!reviewQueueOnly && <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5">
          {[["ALL", "Tất cả"], ["SUBMITTED", "Chờ duyệt"], ["UNDER_REVIEW", "Đang xét duyệt"], ["APPROVED", "Đã duyệt"], ["REVISION_REQUIRED", "Cần chỉnh sửa"], ["REJECTED", "Từ chối"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusAndResetPage(key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                status === key ? "bg-teal-50 text-brand" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {label}
              <span className="ml-1.5 text-[10px] opacity-70">
                {topics.filter((topic) =>
                  matchesAcademicYear(topic, academicYear)
                  && (key === "ALL" || topic.status === key),
                ).length}
              </span>
            </button>
          ))}
        </div>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="hidden grid-cols-[minmax(210px,1.5fr)_minmax(120px,0.8fr)_minmax(150px,1fr)_minmax(100px,0.7fr)_minmax(100px,0.65fr)_minmax(110px,0.7fr)] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:grid">
          <div>Đề tài</div><div>Giảng viên</div><div>Sinh viên thực hiện</div><div>Lĩnh vực</div><div>Ngày gửi</div><div>Trạng thái</div>
        </div>
        {filtered.length ? (
          <div className="divide-y divide-slate-100">
            {pageTopics.map((topic) => {
              const lastApproval = approvals.find((approval) => approval.topic === topic.id);
              return (
                <div
                  key={topic.id}
                  className="grid gap-3 px-4 py-4 transition hover:bg-slate-50/70 sm:px-5 lg:grid-cols-[minmax(210px,1.5fr)_minmax(120px,0.8fr)_minmax(150px,1fr)_minmax(100px,0.7fr)_minmax(100px,0.65fr)_minmax(110px,0.7fr)] lg:items-center lg:gap-4"
                >
                  <button className="min-w-0 text-left" onClick={() => onSelectTopic(topic)}>
                    <div className="flex items-center gap-3">
                      <div className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-brand sm:grid">
                        <BookOpenText size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink hover:text-brand">{topic.title}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{topicCode(topic)} · {topic.major_name || "Chưa phân ngành"} · {topic.academic_year_name || topic.student_assignments?.find((assignment) => assignment.academic_year_name)?.academic_year_name || "Chưa gán năm học"}</div>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 text-xs text-slate-600 lg:block">
                    <span className="w-24 text-[10px] text-slate-400 lg:hidden">Giảng viên</span>
                    {topic.lecturer_name ? topic.lecturer_name : topic.student_assignments?.some((student) => student.lecturer_name) ? (
                      <div className="space-y-1">
                        {[...new Set(topic.student_assignments.map((student) => student.lecturer_name).filter(Boolean))].map((name) => (
                          <div key={name} className="truncate" title={name}>{name}</div>
                        ))}
                      </div>
                    ) : topic.created_by_name || "Chưa phân công"}
                  </div>
                  <div className="min-w-0 text-xs text-slate-600">
                    <span className="mr-2 text-[10px] text-slate-400 lg:hidden">Sinh viên</span>
                    {topic.student_assignments?.length ? (
                      <div className="mt-1 space-y-1 lg:mt-0">
                        {topic.student_assignments.slice(0, 2).map((student) => {
                          const assignment = assignmentStatus[student.status] || {
                            label: student.status || "Không rõ",
                            className: "bg-slate-100 text-slate-600",
                          };
                          return (
                          <div key={student.student_id} className="min-w-0" title={`${student.student_name} (${student.student_code})`}>
                            <div className="truncate">{student.student_name}<span className="ml-1 text-[10px] text-slate-400">{student.student_code}</span></div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1">
                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${assignment.className}`}>{assignment.label}</span>
                              {student.academic_year_name && <span className="text-[9px] text-slate-400">{student.academic_year_name}</span>}
                              <span className="text-[9px] text-slate-400">Gán {formatDate(student.assigned_at)}</span>
                            </div>
                          </div>
                          );
                        })}
                        {topic.student_assignments.length > 2 && (
                          <div className="text-[10px] text-slate-400">+{topic.student_assignments.length - 2} sinh viên</div>
                        )}
                      </div>
                    ) : <span className="text-slate-400">Chưa có sinh viên</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="mr-2 text-[10px] text-slate-400 lg:hidden">Lĩnh vực</span>{topic.field || topic.major_name || "—"}
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="mr-2 text-[10px] text-slate-400 lg:hidden">Ngày gửi</span>{formatDate(topic.created_at)}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-start">
                    <StatusBadge status={topic.status} />
                    {actionable(topic) && (
                      <div className={`flex ${reviewQueueOnly ? "flex-wrap gap-1" : "gap-1"}`}>
                        <button
                          title="Phê duyệt"
                          aria-label={`Phê duyệt ${topic.title}`}
                          onClick={() => onReview(topic, "APPROVE")}
                          className={reviewQueueOnly
                            ? "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                            : "rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50"}
                        ><Check size={16} />{reviewQueueOnly && "Duyệt"}</button>
                        <button
                          title="Yêu cầu chỉnh sửa"
                          aria-label={`Yêu cầu chỉnh sửa ${topic.title}`}
                          onClick={() => onReview(topic, "REQUEST_REVISION")}
                          className={reviewQueueOnly
                            ? "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                            : "rounded-lg p-1.5 text-amber-700 hover:bg-amber-50"}
                        ><FilePenLine size={15} />{reviewQueueOnly && "Sửa"}</button>
                        <button
                          title="Từ chối"
                          aria-label={`Từ chối ${topic.title}`}
                          onClick={() => onReview(topic, "REJECT")}
                          className={reviewQueueOnly
                            ? "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                            : "rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"}
                        ><X size={16} />{reviewQueueOnly && "Từ chối"}</button>
                      </div>
                    )}
                    {lastApproval?.comment && <span className="sr-only">{lastApproval.comment}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title={reviewQueueOnly ? "Không có đề tài chờ xử lý" : "Không tìm thấy đề tài"}
            description={reviewQueueOnly
              ? "Các đề tài có trạng thái Chờ duyệt hoặc Đang xét duyệt sẽ xuất hiện tại đây."
              : "Thử thay đổi từ khóa hoặc bộ lọc trạng thái."}
          />
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          <span>
            {filtered.length
              ? `Hiển thị ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} / ${filtered.length} đề tài`
              : "Hiển thị 0 đề tài"}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              aria-label="Trang trước"
              className="rounded-lg p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            ><ChevronLeft size={16} /></button>
            <span className="px-2 font-medium text-slate-600">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              aria-label="Trang sau"
              className="rounded-lg p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            ><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
