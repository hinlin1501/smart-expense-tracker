// Đổi lỗi tiếng Anh của backend sang tiếng Việt cho các API danh mục / chi tiêu.
const KNOWN = {
  "Category name is required": "Vui lòng nhập tên danh mục.",
  "Category name must not exceed 100 characters": "Tên danh mục tối đa 100 ký tự.",
  "Category already exists": "Tên danh mục đã tồn tại.",
  "Category not found": "Không tìm thấy danh mục.",
  "Invalid category ID": "Danh mục không hợp lệ.",
  "Invalid category": "Danh mục không hợp lệ.",
  "Category is required": "Vui lòng chọn danh mục.",
  "Default category cannot be deleted": "Không thể xóa danh mục mặc định.",
  "Amount is required": "Vui lòng nhập số tiền.",
  "Amount must be greater than 0": "Số tiền phải lớn hơn 0.",
  "Expense date is required": "Vui lòng chọn ngày chi tiêu.",
  "Invalid expense date": "Ngày chi tiêu không hợp lệ.",
  "Invalid start date": "Ngày bắt đầu không hợp lệ.",
  "Invalid end date": "Ngày kết thúc không hợp lệ.",
  "Expense not found": "Không tìm thấy khoản chi tiêu (có thể đã bị xóa).",
  "Invalid expense ID": "Khoản chi tiêu không hợp lệ.",
  "Invalid pagination parameters": "Tham số phân trang không hợp lệ.",
  "Income not found": "Không tìm thấy khoản thu nhập (có thể đã bị xóa).",
  "Invalid income ID": "Khoản thu nhập không hợp lệ.",
  "Income date is required": "Vui lòng chọn ngày nhận.",
  "Invalid income date": "Ngày nhận không hợp lệ.",
};

export function toApiMessage(err) {
  if (!err?.response) return "Không kết nối được máy chủ, vui lòng thử lại.";
  const { status, data } = err.response;
  const msg = data?.message ?? "";
  if (KNOWN[msg]) return KNOWN[msg];
  switch (status) {
    case 400:
      return "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.";
    case 401:
      return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      // Express trả 404 không kèm message khi route chưa tồn tại.
      return msg ? "Không tìm thấy dữ liệu." : "Máy chủ chưa hỗ trợ chức năng này.";
    case 409:
      return "Dữ liệu đã tồn tại.";
    default:
      return "Máy chủ đang gặp sự cố, vui lòng thử lại sau.";
  }
}

export async function call(request) {
  try {
    const { data } = await request;
    return data;
  } catch (err) {
    throw new Error(toApiMessage(err));
  }
}
