import { BookOpenCheck, Sparkles } from "lucide-react";
import { navigation } from "../../constants/navigation.js";

export function Sidebar({ active, onNavigate, mobileOpen, pendingApprovals = 0 }) {
  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          aria-label="Đóng menu"
          onClick={() => onNavigate(active)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col bg-[#102b3a] text-white transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-400/15 text-teal-300">
            <BookOpenCheck size={21} />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-wide">VERITOPIC</div>
            <div className="mt-0.5 text-[10px] font-medium tracking-[0.16em] text-slate-400">QUẢN LÝ HỌC THUẬT</div>
          </div>
        </div>
        <div className="px-4 pt-7">
          <div className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-500">
            KHÔNG GIAN LÀM VIỆC
          </div>
          <nav className="space-y-1">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium transition ${
                  active === id
                    ? "bg-teal-500 text-white shadow-lg shadow-teal-950/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span className="sidebar-label flex-1">{label}</span>
                {id === "topics" && (
                  <span className="sidebar-label rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                    BM
                  </span>
                )}
                {id === "approvals" && pendingApprovals > 0 && (
                  <span className="sidebar-label rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                    {pendingApprovals}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-teal-200">
              <Sparkles size={14} />
              Hỗ trợ quản lý
            </div>
            <p className="mb-3 text-[11px] leading-5 text-slate-400">
              Theo dõi và xét duyệt đề tài của bộ môn tại một nơi.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Cổng Trưởng bộ môn
            </div>
          </div>
          <div className="mt-4 px-2 text-[10px] text-slate-600">© 2026 VERITOPIC</div>
        </div>
      </aside>
    </>
  );
}
