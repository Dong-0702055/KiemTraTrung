import { useEffect, useState } from "react";
import { Check, FilePenLine, Pencil, ScanSearch, X } from "lucide-react";
import { statusLabels } from "../../constants/topics.js";
import { formatDate, topicCode } from "../../utils/formatters.js";
import { Detail } from "../../components/ui/index.jsx";
import { API_URL, apiGet } from "../../services/api.js";

const assignmentStatus = {
  ACTIVE: { label: "Đang thực hiện", className: "bg-emerald-50 text-emerald-700" },
  REMOVED: { label: "Đã gỡ", className: "bg-slate-100 text-slate-500" },
  COMPLETED: { label: "Hoàn thành", className: "bg-indigo-50 text-indigo-700" },
};

function documentUrl(filePath) {
  if (!filePath) return null;
  try {
    const origin = new URL(API_URL).origin;
    const url = new URL(filePath, `${origin}/`);
    return url.origin === origin && ["http:", "https:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function TopicPanel({ topic, onClose, onReview, onEdit, onCheckSimilarity }) {
  const canReview = ["SUBMITTED", "UNDER_REVIEW"].includes(topic.status);
  const [resources, setResources] = useState(null);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");

  useEffect(() => {
    let active = true;
    setResources(null);
    setResourcesLoading(true);
    setResourcesError("");
    apiGet(`/topics/${topic.id}/resources/`)
      .then((data) => {
        if (active) setResources(data);
      })
      .catch((error) => {
        if (active) setResourcesError(error.message);
      })
      .finally(() => {
        if (active) setResourcesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [topic.id]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/35" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="animate-in flex h-full w-full max-w-[540px] flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="min-w-0 pr-4"><div className="text-xs font-semibold text-brand">{topicCode(topic)} · {statusLabels[topic.status] || topic.status}</div><h2 className="mt-2 text-lg font-bold leading-7 text-ink">{topic.title}</h2></div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button>
        </div>
        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Giảng viên" value={topic.lecturer_name || topic.student_assignments?.find((student) => student.lecturer_name)?.lecturer_name || "Chưa phân công"} />
            <Detail label="Người tạo" value={topic.created_by_name || "—"} />
            <Detail label="Ngành" value={topic.major_name || "—"} />
            <Detail label="Khoa" value={topic.department_name || "—"} />
            <Detail label="Năm học" value={topic.academic_year_name || "—"} />
            <Detail label="Học kỳ" value={topic.semester_name || "—"} />
            <Detail label="Lĩnh vực" value={topic.field || "—"} />
            <Detail label="Loại đề tài" value={topic.project_type || "—"} />
            <Detail label="Kiến trúc" value={topic.architecture || "—"} />
            <Detail label="Ngày tạo" value={formatDate(topic.created_at)} />
          </div>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Sinh viên và phân công đề tài</h3>
            {topic.student_assignments?.length ? (
              <ul className="space-y-2">
                {topic.student_assignments.map((student) => {
                  const assignment = assignmentStatus[student.status] || {
                    label: student.status || "Không rõ trạng thái",
                    className: "bg-slate-100 text-slate-600",
                  };
                  return (
                  <li key={student.student_id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-700">{student.student_name}</div>
                      <div className="mt-1 text-xs text-slate-400">{student.student_code}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${assignment.className}`}>{assignment.label}</span>
                        <span className="text-[10px] text-slate-400">Năm học: {student.academic_year_name || "Chưa gán"}</span>
                        <span className="text-[10px] text-slate-400">Phân công: {formatDate(student.assigned_at)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">Giảng viên</div>
                      <div className="mt-1 text-xs font-medium text-slate-600">{student.lecturer_name || topic.lecturer_name || "Chưa phân công"}</div>
                    </div>
                  </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chưa có sinh viên được phân công cho đề tài này.</p>
            )}
          </section>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Mô tả đề tài</h3>
            <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{topic.description || "Chưa có mô tả."}</p>
          </div>
          {topic.keywords && <div><h3 className="mb-2 text-sm font-semibold text-ink">Từ khóa</h3><div className="flex flex-wrap gap-2">{topic.keywords.split(/[,;]/).map((word) => <span key={word} className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700">{word.trim()}</span>)}</div></div>}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Công nghệ sử dụng</h3>
            {resourcesLoading ? (
              <p className="text-sm text-slate-400">Đang tải dữ liệu liên quan...</p>
            ) : resourcesError ? (
              <p role="alert" className="text-sm text-rose-700">{resourcesError}</p>
            ) : resources?.technologies?.length ? (
              <div className="flex flex-wrap gap-2">
                {resources.technologies.map((item) => (
                  <span key={`${item.topic}-${item.technology}`} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                    {item.technology_name}
                    {item.is_primary && <span className="ml-1 text-indigo-400">· chính</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chưa khai báo công nghệ cho đề tài.</p>
            )}
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Chức năng dự kiến</h3>
            {resources?.functions?.length ? (
              <ul className="space-y-2">
                {resources.functions.map((item) => (
                  <li key={item.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-sm font-medium text-slate-700">{item.function_name}</div>
                    {item.description && <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500">{item.description}</p>}
                  </li>
                ))}
              </ul>
            ) : !resourcesLoading && !resourcesError ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chưa khai báo chức năng.</p>
            ) : null}
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Tài liệu đề tài</h3>
            {resources?.documents?.length ? (
              <ul className="space-y-2">
                {resources.documents.map((item) => {
                  const href = documentUrl(item.file_path);
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                      <div className="min-w-0">
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer" className="break-all text-sm font-medium text-brand hover:underline">
                            {item.file_name}
                          </a>
                        ) : (
                          <div className="break-all text-sm font-medium text-slate-700">{item.file_name}</div>
                        )}
                        <div className="mt-1 text-xs text-slate-400">
                          {[item.file_type, item.file_size ? `${Math.ceil(item.file_size / 1024)} KB` : null].filter(Boolean).join(" · ") || "Tài liệu"}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{formatDate(item.uploaded_at)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : !resourcesLoading && !resourcesError ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chưa có tài liệu đính kèm.</p>
            ) : null}
          </section>
          {!resourcesLoading && resources && (
            <div className={`rounded-xl border px-3 py-2 text-xs ${resources.embedding?.available ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
              {resources.embedding?.available
                ? `Embedding AI đã lưu${resources.embedding.model_name ? ` · ${resources.embedding.model_name}` : ""}`
                : "Embedding AI sẽ được tạo khi kiểm tra độ tương đồng."}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-5 sm:px-7">
          <button
            onClick={() => onCheckSimilarity(topic)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-100"
          >
            <ScanSearch size={16} />
            Kiểm tra bằng AI
          </button>
          <button
            onClick={() => onEdit(topic)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={16} />
            Chỉnh sửa đề tài
          </button>
          {canReview && (
            <>
              <button onClick={() => onReview(topic, "APPROVE")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Check size={16} />Phê duyệt</button>
              <button onClick={() => onReview(topic, "REQUEST_REVISION")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"><FilePenLine size={16} />Yêu cầu sửa</button>
              <button onClick={() => onReview(topic, "REJECT")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"><X size={16} />Từ chối</button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
