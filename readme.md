# Smart Expense Tracker (SPET) - Fullstack Web Application

Hệ thống Quản lý Chi tiêu Thông minh (**Smart Expense Tracker - SPET**) thuộc đồ án môn **QLDAPM**. Dự án áp dụng kiến trúc Fullstack tập trung (Monorepo đơn giản), phân tách rõ ràng giữa ứng dụng Client và Server.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

* **Frontend:** React.js (Vite), React Router DOM (v6), Axios, CSS / Tailwind CSS.
* **Backend:** Node.js, Express.js, JWT (JSON Web Token), Bcrypt (Mã hóa mật khẩu).
* **Database & ORM:** PostgreSQL, Prisma ORM.

---

## 📁 Cấu trúc dự án (Project Structure)

```text
smart-expense-tracker/
├── client/                 # Frontend React (Vite Dev Server - Port 5173)
│   ├── src/
│   │   ├── context/        # AuthContext (Quản lý trạng thái xác thực toàn cục)
│   │   ├── pages/          # Các trang giao diện (LoginPage, RegisterPage, DashboardPage)
│   │   ├── routes/         # ProtectedRoute (Bảo vệ các tuyến đường riêng tư)
│   │   ├── services/       # Cấu hình Axios Client (axiosClient.js)
│   │   ├── App.jsx         # Cấu hình Routing chính
│   │   └── main.jsx        # Entry point khởi tạo React DOM
│   ├── index.html          # File HTML gốc (Chứa root div & script main.jsx)
│   └── package.json
│
├── server/                 # Backend Express Server (Port 3000)
│   ├── prisma/             # Cấu hình Schema CSDL Prisma
│   ├── src/
│   │   ├── controllers/    # Logic xử lý API (auth.controller.js, ...)
│   │   ├── middleware/     # Auth Middleware kiểm tra JWT Token
│   │   ├── routes/         # Khai báo đường dẫn API Endpoints
│   │   └── app.js          # File khởi tạo Express Server
│   ├── .env                # Biến môi trường Backend
│   └── package.json
│
└── database.sql            # Script khởi tạo CSDL sơ bộ (Dùng làm backup)
```

# Hướng dẫn Cài đặt & Khởi chạy cục bộ (Local Setup)

## Bước 1: Khởi tạo Cơ sở dữ liệu (PostgreSQL)
Tạo một Database trống trong PostgreSQL (thông qua pgAdmin hoặc SQL Shell):
```sql
CREATE DATABASE smart_expense_db;
```

## Bước 2: Cấu hình và Chạy Backend (server)
Mở Terminal, di chuyển vào thư mục server:
```Bash
cd server
```

Cài đặt các thư viện phụ thuộc:
```Bash
npm install
```

Tạo file .env tại thư mục gốc server với nội dung cấu hình chuẩn của dự án:
```
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/smart_expense_db?schema=public"
JWT_SECRET="super_secret_jwt_key_2026"
PORT=3000
```

Đồng bộ hóa Schema dữ liệu từ Prisma vào PostgreSQL:
```Bash
npx prisma db push
```

Chạy Server Backend ở chế độ Development:
```Bash
npm run dev
```
Backend server sẽ chạy thành công tại: http://localhost:3000

## Bước 3: Cấu hình và Chạy Frontend (client)
Mở một cửa sổ Terminal mới, di chuyển vào thư mục client:
```Bash
cd client
```
Cài đặt các thư viện phụ thuộc:
```Bash
npm install
```
Khởi chạy Vite Dev Server:
```Bash
npm run dev
```
Client web sẽ chạy thành công tại: http://localhost:5173

# Quy định Validation dữ liệu API (Backend Rules)
## 1. Đăng ký tài khoản (POST /api/auth/register)
Request Payload (JSON):
```JSON
{
  "full_name": "Nguyen Van A",
  "email": "user@gmail.com",
  "password": "Password123"
}
```
Ràng buộc kiểm tra:
* **full_name**: Bắt buộc truyền đúng tên trường full_name.
* **email**: Phải đúng định dạng Email tiêu chuẩn.
* **password**: Tối thiểu 8 ký tự.

## 2. Đăng nhập (POST /api/auth/login)
Request Payload (JSON):
```JSON
{
  "email": "user@gmail.com",
  "password": "Password123"
}
```
