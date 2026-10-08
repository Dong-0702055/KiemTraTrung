# Hệ thống quản lý đề tài và kiểm tra trùng lặp

Ứng dụng gồm ba phần: giao diện quản lý cho Trưởng bộ môn, API quản lý dữ liệu
và dịch vụ AI so sánh tên đề tài.

## Chức năng chính

- Đăng nhập và quản lý đề tài, sinh viên, giảng viên, ngành và năm học.
- Theo dõi sinh viên, đề tài và giảng viên hướng dẫn từ bảng phân công
  `topic_students`.
- Duyệt, từ chối hoặc yêu cầu chỉnh sửa đề tài; xem lịch sử và ghi chú duyệt.
- Kiểm tra độ tương đồng tên đề tài bằng PhoBERT, xem danh sách đề tài gần nhất
  và mức cảnh báo.
- Trích xuất tên đề tài từ tệp PDF hoặc DOCX để kiểm tra.

## Kiến trúc

```text
Trình duyệt
    │
    ├── Frontend React + Vite ──► Django REST API ──► Cơ sở dữ liệu
    │                                  │
    │                                  └──► AI FastAPI + PhoBERT
    │
    └── Frontend mặc định: http://localhost:5173
        Backend mặc định:  http://localhost:8000
        AI service:        http://localhost:8001
```

## Cấu trúc thư mục

| Thư mục | Vai trò |
| --- | --- |
| [`FE_KiemTraTrung_TruongBoMon/`](./FE_KiemTraTrung_TruongBoMon/) | Giao diện React, Vite và Tailwind CSS |
| [`BE_KiemTranTrung_TruongBoMon/`](./BE_KiemTranTrung_TruongBoMon/) | Django REST API, xác thực JWT và dữ liệu |
| [`AI_KiemTraTrung_TruongBoMon/`](./AI_KiemTraTrung_TruongBoMon/) | Mô hình PhoBERT, huấn luyện và API suy luận |

## Yêu cầu

- Windows PowerShell (các lệnh dưới đây dùng PowerShell).
- Node.js và npm.
- Python 3.10 hoặc 3.11 được khuyến nghị để chạy dịch vụ AI; cài Python phù hợp
  cho Django backend.
- PostgreSQL nếu dùng cơ sở dữ liệu PostgreSQL hiện có. Backend mặc định dùng
  SQLite khi không cấu hình `DB_ENGINE`.
- Checkpoint mô hình `AI_KiemTraTrung_TruongBoMon\models\tier1_best.pt`.
  Nếu chưa có checkpoint, xem phần [Huấn luyện mô hình](#huấn-luyện-mô-hình).

## Cài đặt và chạy lần đầu

Mở **ba cửa sổ PowerShell** tại thư mục dự án `D:\KiemTraTrung`.

### 1. Backend Django

```powershell
Set-Location .\BE_KiemTranTrung_TruongBoMon
Copy-Item .env.example .env
```

Mở `BE_KiemTranTrung_TruongBoMon\.env` và cấu hình database phù hợp. Để dùng
PostgreSQL, bỏ dấu `#` ở các biến PostgreSQL trong tệp và điền đúng tên database,
tài khoản, mật khẩu, máy chủ và cổng. Không đưa mật khẩu thật vào Git.

Sau đó cài dependencies, áp dụng migration và chạy API:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Nếu hệ thống database đã có tài khoản Trưởng bộ môn, đăng nhập bằng tài khoản
đó. Đối với database mới, tạo tài khoản quản trị bằng lệnh
`python manage.py createsuperuser`; sau đó bảo đảm tài khoản dùng giao diện có role
`HEAD_DEPARTMENT`. Tài khoản đăng nhập cần có trong bảng `users`.

Backend dùng các bảng dữ liệu hiện có khi được cấu hình PostgreSQL. Bảng
`topic_approvals` được quản lý bởi migration Django và sẽ được tạo khi chạy
`python manage.py migrate`.

### 2. Dịch vụ AI

```powershell
Set-Location .\AI_KiemTraTrung_TruongBoMon
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn src.inference.api:app --host 127.0.0.1 --port 8001
```

Lần đầu chạy, Transformers có thể tải PhoBERT `vinai/phobert-base-v2` về cache.
Đảm bảo checkpoint `models\tier1_best.pt` tồn tại trước khi kiểm tra đề tài.
Mở `http://localhost:8001/docs` để xem và thử các endpoint AI; health check là
`http://localhost:8001/health`.

Backend mặc định gọi AI tại `http://localhost:8001`. Nếu đổi địa chỉ hoặc cổng,
cập nhật `AI_SERVICE_URL` trong tệp `.env` của backend.

### 3. Frontend React

```powershell
Set-Location .\FE_KiemTraTrung_TruongBoMon
Copy-Item .env.example .env
npm install
npm run dev
```

Mở `http://localhost:5173`. Frontend mặc định kết nối tới
`http://localhost:8000/api/v1`; đổi `VITE_API_URL` trong
`FE_KiemTraTrung_TruongBoMon\.env` nếu backend chạy ở địa chỉ khác.

Đăng nhập bằng tài khoản có role `HEAD_DEPARTMENT`. Nếu API báo lỗi CORS, thêm
origin của frontend vào `CORS_ALLOWED_ORIGINS` trong `.env` của backend.

## Huấn luyện mô hình

Đặt dữ liệu huấn luyện tại
`AI_KiemTraTrung_TruongBoMon\data\title_pairs.csv`. CSV cần có các cột:

```text
id,title_a,title_b,label,similarity_level
```

`label` nhận giá trị từ `0` đến `4`: không tương đồng, tương đồng thấp, trung
bình, cao và gần như trùng. Chạy lệnh từ thư mục AI:

```powershell
python -m src.training.train
python -m src.training.evaluate
```

Checkpoint được lưu tại `models\tier1_best.pt`; kết quả huấn luyện và đánh giá
được lưu trong `results\`. Mô hình cần đủ dữ liệu đã gán nhãn để đánh giá đáng
tin cậy; bộ dữ liệu nhỏ chỉ phù hợp để thử nghiệm pipeline.

## API thường dùng

Tất cả endpoint backend nằm dưới `/api/v1/`. Ngoại trừ health check và cấp token,
các endpoint yêu cầu JWT.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `GET` | `/api/v1/health/` | Kiểm tra backend |
| `POST` | `/api/v1/auth/token/` | Đăng nhập, nhận access/refresh token |
| `GET` | `/api/v1/auth/me/` | Lấy tài khoản đang đăng nhập |
| `GET`, `POST`, `PATCH` | `/api/v1/students/` | Xem, thêm và sửa hồ sơ sinh viên |
| `GET` | `/api/v1/topics/` | Danh sách đề tài và phân công sinh viên |
| `POST` | `/api/v1/topics/{id}/review/` | Duyệt, từ chối hoặc yêu cầu chỉnh sửa |
| `GET` | `/api/v1/approvals/` | Lịch sử phê duyệt |
| `POST` | `/api/v1/similarity/checks/check/` | Kiểm tra tên đề tài bằng AI |

API AI cung cấp `POST /api/v1/check-title` để xếp hạng đề tài tương tự,
`POST /api/v1/encode-titles` để tạo embeddings và `GET /health` để kiểm tra tình
trạng service.

## Kiểm tra trước khi gửi thay đổi

```powershell
# Backend
Set-Location .\BE_KiemTranTrung_TruongBoMon
python manage.py check
python manage.py test config.tests

# Frontend
Set-Location ..\FE_KiemTraTrung_TruongBoMon
npm run build
```

## Bảo mật và vận hành

- Không commit `.env`, mật khẩu, JWT, khóa bí mật hoặc dữ liệu cá nhân thật.
- Trước khi triển khai, đặt `DJANGO_DEBUG=0`, tạo `DJANGO_SECRET_KEY` đủ mạnh,
  cấu hình `DJANGO_ALLOWED_HOSTS` và chỉ cho phép các origin frontend cần thiết.
- Hạn chế quyền database theo nhu cầu của ứng dụng và sao lưu dữ liệu trước khi
  chạy migration trên môi trường có dữ liệu quan trọng.
- Kết quả tương đồng AI hỗ trợ rà soát, không thay thế quyết định phê duyệt của
  người có thẩm quyền.
