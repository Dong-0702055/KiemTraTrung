import { Activity, ArrowRight, BookOpenText, CheckCheck, CheckCircle2, ChevronRight, CircleHelp, ClipboardList, FilePenLine, UsersRound, XCircle } from "lucide-react";
import { formatDate, initials, topicCode } from "../../utils/formatters.js";
import { StatusBadge, EmptyState } from "../../components/ui/index.jsx";

const approvalActivity = {
  APPROVE: {
    label: "Đã phê duyệt đề tài",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-600",
  },
  REJECT: {
    label: "Đã từ chối đề tài",
    icon: XCircle,
    className: "bg-rose-50 text-rose-600",
  },
  REQUEST_REVISION: {
    label: "Yêu cầu chỉnh sửa đề tài",
    icon: FilePenLine,
    className: "bg-amber-50 text-amber-700",
  },
};

export function Overview({ data, onShowApprovals, onSelectTopic }) {
  const topicById = new Map(data.topics.map((topic) => [String(topic.id), topic]));
  const waiting = data.topics.filter((topic) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(topic.status),
  );
  const approved = data.topics.filter((topic) => topic.status === "APPROVED");
  const cards = [
    { label: "Tổng đề tài", value: data.topics.length, icon: BookOpenText, tint: "teal", note: "Trong hệ thống" },
    { label: "Chờ xét duyệt", value: waiting.length, icon: ClipboardList, tint: "amber", note: "Cần được xử lý" },
    { label: "Đã phê duyệt", value: approved.length, icon: CheckCircle2, tint: "green", note: "Đề tài thông qua" },
    { label: "Giảng viên", value: data.lecturers.length, icon: UsersRound, tint: "blue", note: "Thuộc bộ môn" },
  ];

  return (
    <div className="animate-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm font-medium text-brand">Tổng quan bộ môn</div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
            Xin chào, Trưởng bộ môn <span aria-hidden="true">👋</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Theo dõi tình hình đề tài và công việc cần xử lý hôm nay.
          </p>
        </div>
        <button
          onClick={onShowApprovals}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <BookOpenText size={17} />
          Đề tài cần phê duyệt
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tint, note }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">{label}</div>
                <div className="mt-3 text-3xl font-bold tracking-tight text-ink">{value}</div>
              </div>
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${
                tint === "teal" ? "bg-teal-50 text-teal-700" :
                tint === "amber" ? "bg-amber-50 text-amber-700" :
                tint === "green" ? "bg-emerald-50 text-emerald-700" :
                "bg-sky-50 text-sky-700"
              }`}>
                <Icon size={20} />
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">{note}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="font-semibold text-ink">Đề tài cần quan tâm</h3>
              <p className="mt-1 text-xs text-slate-400">Các đề tài mới gửi chờ xét duyệt</p>
            </div>
            <button onClick={onShowApprovals} className="text-xs font-semibold text-brand hover:underline">
              Mở hàng chờ
            </button>
          </div>
          {waiting.length ? (
            <div className="divide-y divide-slate-100">
              {waiting.slice(0, 5).map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onSelectTopic(topic)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-xs font-bold text-brand">
                    {initials(topic.lecturer_name || topic.created_by_name || "DT")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{topic.title}</div>
                    <div className="mt-1 truncate text-xs text-slate-400">
                      {topicCode(topic)} · {topic.lecturer_name || topic.created_by_name || "Chưa phân công"}
                    </div>
                  </div>
                  <StatusBadge status={topic.status} />
                  <ChevronRight className="hidden text-slate-300 sm:block" size={17} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCheck} title="Không có đề tài chờ duyệt" description="Các đề tài mới gửi sẽ hiển thị tại đây." />
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Activity size={17} className="text-brand" />
            Hoạt động gần đây
          </div>
          <div className="mt-5 space-y-5">
            {data.approvals.slice(0, 5).map((approval) => {
              const activity = approvalActivity[approval.action] || {
                label: "Cập nhật trạng thái đề tài",
                icon: Activity,
                className: "bg-slate-100 text-slate-600",
              };
              const Icon = activity.icon;
              const topicId =
                approval.topic && typeof approval.topic === "object"
                  ? approval.topic.id
                  : approval.topic;
              const relatedTopic = topicById.get(String(topicId));
              const title =
                [
                  approval.topic_title,
                  approval.topic?.title,
                  relatedTopic?.title,
                ].find((value) => typeof value === "string" && value.trim()) ||
                "Không tìm thấy tên đề tài";

              return (
                <div key={approval.id} className="flex gap-3">
                  <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${activity.className}`}>
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-ink">{activity.label}</div>
                    <div className="mt-1 break-words text-xs font-medium leading-5 text-slate-700">
                      {title}
                    </div>
                    {approval.topic_code && (
                      <div className="mt-0.5 text-[10px] text-slate-400">{approval.topic_code}</div>
                    )}
                    {approval.comment?.trim() && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs leading-5 text-slate-600">
                        <span className="font-semibold text-slate-700">Ghi chú: </span>
                        {approval.comment}
                      </p>
                    )}
                    <div className="mt-1 text-[10px] text-slate-400">
                      {approval.approver_name ? `${approval.approver_name} · ` : ""}
                      {formatDate(approval.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            {!data.approvals.length && (
              <p className="py-5 text-center text-xs text-slate-400">Chưa có hoạt động gần đây.</p>
            )}
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <div className="mb-1 flex items-center gap-2 font-semibold text-slate-700">
              <CircleHelp size={14} className="text-brand" />
              Gợi ý
            </div>
            Xử lý các đề tài đang chờ duyệt để sinh viên và giảng viên kịp tiến độ.
          </div>
        </section>
      </div>
    </div>
  );
}
