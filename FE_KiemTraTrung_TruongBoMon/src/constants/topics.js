export const statusLabels = {
  DRAFT: "Bản nháp",
  SUBMITTED: "Chờ duyệt",
  UNDER_REVIEW: "Đang xét duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  REVISION_REQUIRED: "Yêu cầu chỉnh sửa",
  CANCELLED: "Đã hủy",
};

export const statusClasses = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-amber-50 text-amber-700",
  UNDER_REVIEW: "bg-sky-50 text-sky-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  REVISION_REQUIRED: "bg-orange-50 text-orange-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export const emptyData = {
  topics: [],
  lecturers: [],
  students: [],
  majors: [],
  departments: [],
  academicYears: [],
  cohorts: [],
  semesters: [],
  approvals: [],
};
