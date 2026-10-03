import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Chưa đăng nhập (hoặc vừa đăng xuất / token hết hạn) thì chuyển về trang Đăng nhập.
export default function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/dang-nhap" replace />;
  return <Outlet />;
}
