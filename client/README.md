# Smart Expense Tracker – Client (React + Vite + Tailwind CSS)

## Chạy
```bash
npm install
npm run dev
```
Mở http://localhost:5173 (backend chạy ở http://localhost:3000). Địa chỉ backend sửa trong `.env` (`VITE_API_URL`).

## Cấu trúc `src/`
- `context/AuthContext.jsx` – trạng thái đăng nhập toàn cục: `user`, `login`, `register`, `logout`
- `routes/ProtectedRoute.jsx` – chưa đăng nhập thì chuyển về `/dang-nhap`
- `services/axiosClient.js` – cấu hình Axios, tự gắn JWT vào request
- `pages/` – `LoginPage`, `RegisterPage`, `DashboardPage`
- `components/` – `AuthLayout`, `ui/button.jsx` (dùng chung)
- `lib/utils.js` – hàm `cn()` gộp class Tailwind
- `App.jsx` – khai báo route · `main.jsx` – khởi tạo React
