import { useCallback, useEffect, useState } from "react";
import { Activity, AlertCircle, LoaderCircle, LogOut, Menu } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost, clearTokens, getAccessToken, login as requestLogin, loadCurrentUser } from "../services/api.js";
import { emptyData } from "../constants/topics.js";
import { navigation } from "../constants/navigation.js";
import { initials } from "../utils/formatters.js";
import { Sidebar } from "../components/layout/Sidebar.jsx";
import { ProfileDialog } from "../components/layout/ProfileDialog.jsx";
import { ManagementDialog } from "../components/forms/ManagementDialog.jsx";
import { ScreenErrorBoundary, Toast } from "../components/ui/index.jsx";
import { LoginScreen } from "../features/auth/LoginScreen.jsx";
import { Overview } from "../features/dashboard/Overview.jsx";
import { TopicsPage } from "../features/topics/TopicsPage.jsx";
import { TopicPanel } from "../features/topics/TopicPanel.jsx";
import { TopicEditDialog } from "../features/topics/TopicEditDialog.jsx";
import { LecturersPage } from "../features/lecturers/LecturersPage.jsx";
import { StudentsPage } from "../features/students/StudentsPage.jsx";
import { StudentDialog } from "../features/students/StudentDialog.jsx";
import { FieldsPage } from "../features/fields/FieldsPage.jsx";
import { AiSimilarityPage } from "../features/topics/AiSimilarityPage.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(getAccessToken()));
  const [authError, setAuthError] = useState("");
  const [page, setPage] = useState("overview");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [aiInitialTopic, setAiInitialTopic] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const announce = useCallback((message, type = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 4200);
  }, []);

  const acceptUser = useCallback((account) => {
    if (account.role !== "HEAD_DEPARTMENT") {
      clearTokens();
      setUser(null);
      setAuthError("Tài khoản chưa được cấp quyền Trưởng bộ môn.");
      return false;
    }
    setUser(account);
    setAuthError("");
    return true;
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;
    loadCurrentUser()
      .then(acceptUser)
      .catch((error) => {
        clearTokens();
        setAuthError(error.message);
      })
      .finally(() => setBooting(false));
  }, [acceptUser]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setLoadError("");

    Promise.allSettled([
      apiGet("/topics/"),
      apiGet("/lecturers/"),
      apiGet("/students/"),
      apiGet("/majors/"),
      apiGet("/departments/"),
      apiGet("/academic-years/"),
      apiGet("/cohorts/"),
      apiGet("/semesters/"),
      apiGet("/approvals/"),
    ])
      .then((results) => {
        if (!active) return;
        const keys = ["topics", "lecturers", "students", "majors", "departments", "academicYears", "cohorts", "semesters", "approvals"];
        const next = { ...emptyData };
        const failures = [];
        results.forEach((result, index) => {
          if (result.status === "fulfilled") next[keys[index]] = result.value;
          else failures.push(`${keys[index]}: ${result.reason.message}`);
        });
        setData(next);
        if (failures.length) {
          setLoadError(`Một số dữ liệu chưa tải được — ${failures.join(" · ")}`);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, refreshKey]);

  const signOut = () => {
    clearTokens();
    setUser(null);
    setData(emptyData);
    setPage("overview");
    setAuthError("");
  };

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center text-brand">
        <LoaderCircle className="animate-spin" size={30} />
      </div>
    );
  }
  if (!user) {
    return (
      <LoginScreen
        error={authError}
        onLogin={async (username, password) => {
          setAuthError("");
          try {
            const account = await requestLogin(username, password);
            if (acceptUser(account)) setRefreshKey((value) => value + 1);
          } catch (error) {
            setAuthError(error.message);
          }
        }}
      />
    );
  }

  const pageTitle = navigation.find((item) => item.id === page)?.label || "Tổng quan";
  const refresh = () => setRefreshKey((value) => value + 1);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        active={page}
        mobileOpen={mobileNav}
        pendingApprovals={data.topics.filter((topic) => ["SUBMITTED", "UNDER_REVIEW"].includes(topic.status)).length}
        onNavigate={(nextPage) => {
          setPage(nextPage);
          setMobileNav(false);
          setSelectedTopic(null);
        }}
      />
      <div className="min-h-screen lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Mở menu"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={21} />
            </button>
            <div>
              <div className="text-xs font-medium text-slate-400">TRƯỞNG BỘ MÔN</div>
              <h1 className="mt-0.5 text-lg font-semibold text-ink">{pageTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              title="Tải lại dữ liệu"
              onClick={refresh}
              className="hidden rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 sm:block"
            >
              <Activity size={18} />
            </button>
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2.5">
              <button
                aria-label="Mở thông tin cá nhân"
                title="Thông tin cá nhân"
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                type="button"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-xs font-bold text-brand">
                  {initials(user.full_name || user.username)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-ink">
                    {user.full_name || user.username}
                  </div>
                  <div className="text-xs text-slate-400">Trưởng bộ môn</div>
                </div>
              </button>
              <button
                aria-label="Đăng xuất"
                title="Đăng xuất"
                onClick={signOut}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-7 sm:py-8">
          {loadError && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <div className="min-w-0 flex-1">{loadError}</div>
              <button onClick={refresh} className="shrink-0 font-semibold underline">
                Thử lại
              </button>
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="animate-spin" size={16} />
              Đang đồng bộ dữ liệu từ hệ thống…
            </div>
          )}
          <ScreenErrorBoundary key={page}>
            {page === "overview" && (
              <Overview
                data={data}
                onShowApprovals={() => setPage("approvals")}
                onSelectTopic={setSelectedTopic}
              />
            )}
            {page === "topics" && (
              <TopicsPage
                topics={data.topics}
                approvals={data.approvals}
                academicYears={data.academicYears}
                onSelectTopic={setSelectedTopic}
                onReview={(topic, decision) => setDialog({ type: "review", topic, decision })}
              />
            )}
            {page === "approvals" && (
              <TopicsPage
                topics={data.topics}
                approvals={data.approvals}
                academicYears={data.academicYears}
                onSelectTopic={setSelectedTopic}
                onReview={(topic, decision) => setDialog({ type: "review", topic, decision })}
                reviewQueueOnly
              />
            )}
            {page === "ai-check" && (
              <AiSimilarityPage
                topics={data.topics}
                initialTopic={aiInitialTopic}
                onInitialTopicUsed={() => setAiInitialTopic(null)}
              />
            )}
            {page === "lecturers" && (
              <LecturersPage
                lecturers={data.lecturers}
                topics={data.topics}
                onAdd={() => setDialog({ type: "lecturer" })}
                onEdit={(lecturer) => setDialog({ type: "lecturer", lecturer })}
              />
            )}
            {page === "students" && (
              <StudentsPage
                students={data.students}
                topics={data.topics}
                lecturers={data.lecturers}
                onAdd={() => setDialog({ type: "student" })}
                onEdit={(student) => setDialog({ type: "student", student })}
              />
            )}
            {page === "fields" && (
              <FieldsPage
                fields={data.majors}
                onAdd={() => setDialog({ type: "field" })}
                onEdit={(field) => setDialog({ type: "field", field })}
                onDelete={(field) => setDialog({ type: "delete-field", field })}
              />
            )}
          </ScreenErrorBoundary>
        </main>
      </div>

      {selectedTopic && (
        <TopicPanel
          topic={data.topics.find((topic) => topic.id === selectedTopic.id) || selectedTopic}
          onClose={() => setSelectedTopic(null)}
          onReview={(topic, decision) => setDialog({ type: "review", topic, decision })}
          onEdit={(topic) => setDialog({ type: "topic-edit", topic })}
          onCheckSimilarity={(topic) => {
            setAiInitialTopic(topic);
            setSelectedTopic(null);
            setPage("ai-check");
          }}
        />
      )}
      {profileOpen && (
        <ProfileDialog user={user} onClose={() => setProfileOpen(false)} />
      )}
      {dialog?.type === "topic-edit" && (
        <TopicEditDialog
          topic={dialog.topic}
          fields={data.majors}
          majors={data.majors}
          departments={data.departments}
          lecturers={data.lecturers}
          academicYears={data.academicYears}
          semesters={data.semesters}
          onClose={() => setDialog(null)}
          onSubmit={async (formData) => {
            await apiPatch(`/topics/${dialog.topic.id}/`, formData);
            setDialog(null);
            announce("Đã cập nhật thông tin đề tài.");
            refresh();
          }}
        />
      )}
      {dialog?.type === "student" && (
        <StudentDialog
          student={dialog.student}
          majors={data.majors}
          cohorts={data.cohorts}
          academicYears={data.academicYears}
          onClose={() => setDialog(null)}
          onSubmit={async (formData) => {
            if (dialog.student) {
              await apiPatch(`/students/${dialog.student.id}/`, formData);
              announce("Đã cập nhật hồ sơ sinh viên.");
            } else {
              await apiPost("/students/", formData);
              announce("Đã thêm sinh viên.");
            }
            setDialog(null);
            refresh();
          }}
        />
      )}
      {dialog && dialog.type !== "topic-edit" && dialog.type !== "student" && (
        <ManagementDialog
          dialog={dialog}
          departments={data.departments}
          onClose={() => setDialog(null)}
          onSubmit={async (formData) => {
            try {
              if (dialog.type === "review") {
                await apiPost(`/topics/${dialog.topic.id}/review/`, {
                  decision: dialog.decision,
                  comment: formData.comment || "",
                });
                announce("Đã cập nhật kết quả xét duyệt đề tài.");
              } else if (dialog.type === "lecturer") {
                if (dialog.lecturer) {
                  await apiPatch(`/lecturers/${dialog.lecturer.id}/`, formData);
                  announce("Đã cập nhật thông tin giảng viên.");
                } else {
                  await apiPost("/lecturers/", formData);
                  announce("Đã thêm giảng viên.");
                }
              } else if (dialog.type === "field") {
                if (dialog.field) {
                  await apiPatch(`/majors/${dialog.field.id}/`, formData);
                  announce("Đã cập nhật danh mục.");
                } else {
                  await apiPost("/majors/", formData);
                  announce("Đã thêm danh mục.");
                }
              } else if (dialog.type === "delete-field") {
                await apiDelete(`/majors/${dialog.field.id}/`);
                announce("Đã xóa danh mục.");
              }
              setDialog(null);
              refresh();
            } catch (error) {
              announce(error.message, "error");
              throw error;
            }
          }}
        />
      )}
      {notice && <Toast notice={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}
