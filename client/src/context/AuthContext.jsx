import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosClient, { TOKEN_KEY, USER_KEY } from "@/services/axiosClient";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const STRONG_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const AuthContext = createContext(null);

// Đọc thời điểm hết hạn (exp, tính bằng giây) trong JWT.
function tokenExpiry(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const exp = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Khôi phục phiên từ localStorage; token hết hạn hoặc hỏng thì xóa.
function readStoredUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(USER_KEY);
  if (!token || !raw) return null;
  const exp = tokenExpiry(token);
  if (exp !== null && exp * 1000 <= Date.now()) {
    clearStorage();
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    clearStorage();
    return null;
  }
}

// Đổi lỗi từ backend thành thông báo tiếng Việt để hiển thị.
function toMessage(err) {
  if (!err.response) return "Không kết nối được máy chủ, vui lòng thử lại.";
  switch (err.response.status) {
    case 401:
      return "Email hoặc mật khẩu không chính xác.";
    case 403:
      return "Tài khoản đã bị vô hiệu hóa.";
    case 409:
      return "Email đã được sử dụng.";
    case 400:
      return "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.";
    default:
      return "Máy chủ đang gặp sự cố, vui lòng thử lại sau.";
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const logout = useCallback(() => {
    clearStorage();
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await axiosClient.post("/auth/login", { email, password });
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      throw new Error(toMessage(err));
    }
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    try {
      await axiosClient.post("/auth/register", { full_name: fullName, email, password });
    } catch (err) {
      throw new Error(toMessage(err));
    }
  }, []);

  // Cập nhật thông tin user sau khi sửa hồ sơ.
  const updateUser = useCallback((nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  // Tự đăng xuất đúng lúc token hết hạn.
  useEffect(() => {
    if (!user) return undefined;
    const exp = tokenExpiry(localStorage.getItem(TOKEN_KEY) ?? "");
    if (exp === null) return undefined;
    const ms = exp * 1000 - Date.now();
    if (ms <= 0) {
      logout();
      return undefined;
    }
    const id = window.setTimeout(logout, Math.min(ms, 2 ** 31 - 1));
    return () => window.clearTimeout(id);
  }, [user, logout]);

  const value = useMemo(() => ({ user, login, register, logout, updateUser }), [user, login, register, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>.");
  return ctx;
}
