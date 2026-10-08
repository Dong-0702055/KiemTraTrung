import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export class ScreenErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Screen rendering failed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white px-6 py-12 text-center shadow-card"
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={22} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">
            Không thể hiển thị trang này
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Đã xảy ra lỗi khi tải nội dung. Hãy thử mở lại trang hoặc chọn một mục
            khác trong menu.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Thử lại
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
