import { useState } from "react";
import { ArrowRight, BookOpenCheck, CircleHelp, LoaderCircle, Sparkles } from "lucide-react";

export function LoginScreen({ error, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    await onLogin(username, password);
    setSubmitting(false);
  };
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-[#102b3a] p-12 text-white lg:flex">
        <div className="absolute -right-32 -top-28 h-[440px] w-[440px] rounded-full border border-teal-200/10" />
        <div className="absolute -right-16 -top-12 h-[310px] w-[310px] rounded-full border border-teal-200/10" />
        <div className="absolute -bottom-44 -left-32 h-[480px] w-[480px] rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-400/15 text-teal-300"><BookOpenCheck size={22} /></div><div className="text-lg font-bold">VERITOPIC</div></div>
        <div className="relative z-10 max-w-lg">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-medium text-teal-200"><Sparkles size={14} />CỔNG QUẢN LÝ HỌC THUẬT</div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Quản lý đề tài.<br /><span className="text-teal-300">Dẫn lối tri thức.</span></h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">Không gian dành riêng cho Trưởng bộ môn theo dõi, xét duyệt đề tài và quản lý nguồn lực học thuật.</p>
        </div>
        <div className="relative z-10 text-xs text-slate-500">© 2026 VERITOPIC </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-8 lg:hidden"><div className="flex items-center gap-2 text-lg font-bold text-ink"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-brand"><BookOpenCheck size={20} /></span>VERITOPIC</div></div>
          <div className="mb-8"><div className="text-sm font-semibold text-brand">CHÀO MỪNG TRỞ LẠI</div><h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Đăng nhập</h2></div>
          <form onSubmit={submit} className="space-y-5">
            <label className="block text-sm font-medium text-slate-700">Tên đăng nhập
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-teal-50" placeholder="Nhập tên đăng nhập" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Mật khẩu
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-teal-50" placeholder="Nhập mật khẩu" />
            </label>
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</div>}
            <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:bg-brand-dark disabled:opacity-60">
              {submitting ? <><LoaderCircle size={17} className="animate-spin" />Đang đăng nhập...</> : <>Đăng nhập <ArrowRight size={17} /></>}
            </button>
          </form>
          <div className="mt-8 flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 text-xs leading-5 text-slate-500"><CircleHelp size={15} className="mt-0.5 shrink-0 text-brand" />Tài khoản phải có role <code className="rounded bg-white px-1 text-[11px] text-slate-700">HEAD_DEPARTMENT</code> để truy cập.</div>
          <div className="mt-8 text-center text-xs text-slate-400">Version 1.0.0</div>
        </div>
      </div>
    </div>
  );
}
