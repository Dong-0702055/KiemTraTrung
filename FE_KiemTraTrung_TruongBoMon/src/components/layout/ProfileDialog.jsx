import { useEffect } from "react";
import { BadgeCheck, BookUser, Mail, Phone, UserRound, X } from "lucide-react";
import { initials } from "../../utils/formatters.js";

const roleLabels = {
  ADMIN: "Quản trị viên",
  HEAD_DEPARTMENT: "Trưởng bộ môn",
  LECTURER: "Giảng viên",
  STUDENT: "Sinh viên",
};

function ProfileField({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 p-3">
      {Icon && <Icon className="mt-0.5 shrink-0 text-slate-400" size={16} />}
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-slate-400">{label}</div>
        <div className="mt-1 break-words text-sm font-medium text-slate-700">
          {value || "Chưa cập nhật"}
        </div>
      </div>
    </div>
  );
}

export function ProfileDialog({ user, onClose }) {
  const lecturer = user.lecturer_profile;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="profile-dialog-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-50 font-semibold text-brand">
              {initials(user.full_name || user.username)}
            </div>
            <div>
              <div className="text-xs font-medium text-brand">TÀI KHOẢN</div>
              <h2 id="profile-dialog-title" className="mt-1 text-xl font-bold text-ink">
                Thông tin cá nhân
              </h2>
            </div>
          </div>
          <button
            aria-label="Đóng thông tin cá nhân"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ProfileField label="Họ và tên" value={user.full_name} icon={UserRound} />
          <ProfileField label="Tên đăng nhập" value={user.username} icon={BadgeCheck} />
          <ProfileField label="Email" value={user.email} icon={Mail} />
          <ProfileField label="Số điện thoại" value={user.phone} icon={Phone} />
          <ProfileField label="Vai trò" value={roleLabels[user.role] || user.role} />
          <ProfileField
            label="Trạng thái tài khoản"
            value={user.is_active ? "Đang hoạt động" : "Đã khóa"}
          />
        </div>

        {lecturer && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <BookUser className="text-brand" size={17} />
              Hồ sơ giảng viên
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileField label="Mã giảng viên" value={lecturer.lecturer_code} />
              <ProfileField
                label="Khoa"
                value={lecturer.department_name || lecturer.department}
              />
              <ProfileField label="Học vị" value={lecturer.academic_degree} />
              <ProfileField label="Chuyên môn" value={lecturer.specialization} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
