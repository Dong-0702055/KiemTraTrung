# FE Trưởng bộ môn — Quản lý đề tài

Giao diện React + Vite + Tailwind CSS dành riêng cho Trưởng bộ môn, gồm:

- UC-BM-03: xem, tìm kiếm, lọc và xem chi tiết đề tài.
- UC-BM-07: phê duyệt hoặc từ chối đề tài.
- UC-BM-08: yêu cầu sinh viên/giảng viên chỉnh sửa đề tài kèm nhận xét.
- UC-BM-09: xem, thêm và sửa thông tin giảng viên.
- UC-BM-10: xem danh sách sinh viên.
- UC-BM-11: xem, thêm, sửa và xóa lĩnh vực (danh mục ngành/lĩnh vực).
- Kiểm tra tên đề tài có khả năng trùng lặp bằng AI và xem mức độ tương đồng.
- Tải PDF/DOCX để trích xuất, xác nhận tên đề tài rồi kiểm tra bằng AI.

## Cấu trúc mã nguồn

```text
src/
├── app/                 # Ghép ứng dụng và điều phối đăng nhập, dữ liệu, layout
├── components/
│   ├── forms/           # Biểu mẫu dùng chung
│   ├── layout/          # Sidebar và khung bố cục
│   └── ui/              # Thành phần giao diện dùng lại
├── constants/           # Trạng thái đề tài, menu điều hướng
├── features/
│   ├── auth/            # Đăng nhập
│   ├── dashboard/       # Tổng quan
│   ├── fields/          # UC-BM-11
│   ├── lecturers/       # UC-BM-09
│   ├── students/        # UC-BM-10
│   └── topics/          # UC-BM-03, UC-BM-07, UC-BM-08 và kiểm tra AI
├── services/            # Giao tiếp API và JWT
└── utils/               # Hàm định dạng và hiển thị dữ liệu
```

## Chạy giao diện

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Mặc định FE gọi Django API tại `http://localhost:8000/api/v1`. Đổi `VITE_API_URL`
trong `.env` nếu backend chạy ở địa chỉ khác. Backend phải cho phép CORS từ
`http://localhost:5173`.

Đăng nhập bằng username/password của tài khoản có role `HEAD_DEPARTMENT`.
Access/refresh token được lưu trong `sessionStorage`; đăng xuất sẽ xóa token.
FE dùng các endpoint đã có của backend: `/auth/token/`, `/auth/me/`, `/topics/`,
`/topics/{id}/review/`, `/lecturers/`, `/students/`, `/majors/`, `/departments/`,
`/approvals/` và `POST /similarity/checks/check/`. Kiểm tra AI nhận `title`,
`top_k` (1–100) và `source_topic_id` tùy chọn; backend gọi AI Service, so sánh
với các đề tài đã được phê duyệt và trả về `results`. FE tự tải tất cả các trang
phân trang từ Django API; danh sách
đề tài hiển thị 20 mục mỗi trang và cho phép chuyển qua lại giữa các trang.
Chi tiết đề tài đọc thêm `/topics/{id}/resources/` để hiển thị công nghệ, chức
năng, tài liệu đính kèm và trạng thái cache embedding AI.

Đăng nhập bằng role `HEAD_DEPARTMENT`; backend hiện cấp quyền đầy đủ cho role
Trưởng bộ môn trên các API đã cấu hình, bao gồm API kiểm tra tương đồng. Kết quả
AI hỗ trợ việc rà soát và không thay thế quyết định phê duyệt của Trưởng bộ môn.
