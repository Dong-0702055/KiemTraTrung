import { ClipboardCheck, ClipboardList, GraduationCap, LayoutDashboard, BookOpenText, ScanSearch, UsersRound } from "lucide-react";

export const navigation = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "topics", label: "Quản lý đề tài", icon: BookOpenText },
  { id: "approvals", label: "Phê duyệt đề tài", icon: ClipboardCheck },
  { id: "ai-check", label: "Kiểm tra trùng bằng AI", icon: ScanSearch },
  { id: "lecturers", label: "Giảng viên", icon: UsersRound },
  { id: "students", label: "Sinh viên", icon: GraduationCap },
  { id: "fields", label: "Danh mục / lĩnh vực", icon: ClipboardList },
];
