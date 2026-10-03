import axios from "axios";

export const TOKEN_KEY = "accessToken";
export const USER_KEY = "user";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

// Gắn JWT vào mọi request nếu đã đăng nhập.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token bị từ chối ở API riêng tư (không phải đăng nhập/đăng ký) thì xóa phiên và về trang đăng nhập.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.startsWith("/auth/")) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== "/dang-nhap") window.location.assign("/dang-nhap");
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
