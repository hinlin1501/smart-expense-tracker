import axiosClient from "@/services/axiosClient";

const WEAK_PASSWORD = "Mật khẩu tối thiểu 8 ký tự, gồm cả chữ và số.";

// Thông báo tiếng Anh của backend -> tiếng Việt.
const KNOWN = {
  "Invalid reset token": "Liên kết đặt lại mật khẩu không hợp lệ.",
  "Reset token has already been used": "Liên kết này đã được sử dụng. Hãy yêu cầu liên kết mới.",
  "Reset token has expired": "Liên kết đã hết hạn (15 phút). Hãy yêu cầu liên kết mới.",
  "Current password is incorrect": "Mật khẩu hiện tại không chính xác.",
  "Email is already in use": "Email đã được sử dụng.",
  "Invalid email format": "Email không đúng định dạng.",
  "User not found": "Không tìm thấy tài khoản.",
};

export function toAuthMessage(err) {
  if (!err.response) return "Không kết nối được máy chủ, vui lòng thử lại.";
  const { status, data } = err.response;
  const msg = data?.message ?? "";
  if (KNOWN[msg]) return KNOWN[msg];
  if (/password must be/i.test(msg)) return WEAK_PASSWORD;
  switch (status) {
    case 400:
      return "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.";
    case 401:
      return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";
    case 404:
      return "Không tìm thấy tài khoản.";
    case 409:
      return "Email đã được sử dụng.";
    default:
      return "Máy chủ đang gặp sự cố, vui lòng thử lại sau.";
  }
}

async function call(request) {
  try {
    const { data } = await request;
    return data;
  } catch (err) {
    throw new Error(toAuthMessage(err));
  }
}

// POST /auth/forgot-password -> { message, resetToken? }
export const forgotPassword = (email) =>
  call(axiosClient.post("/auth/forgot-password", { email }));

// POST /auth/reset-password -> { message }
export const resetPassword = (token, newPassword) =>
  call(axiosClient.post("/auth/reset-password", { token, newPassword }));

// POST /auth/change-password (cần đăng nhập) -> { message }
export const changePassword = (currentPassword, newPassword) =>
  call(axiosClient.post("/auth/change-password", { currentPassword, newPassword }));

// POST /auth/profile (cần đăng nhập) -> { message, user }
export const updateProfile = ({ full_name, email }) =>
  call(axiosClient.post("/auth/profile", { full_name, email }));
