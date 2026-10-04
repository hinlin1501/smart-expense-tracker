import axiosClient from "@/services/axiosClient";
import { call } from "@/services/apiError";
import { getExpenses } from "@/services/expenseService";

// GET /categories -> { categories: [...] } (mặc định trước, rồi theo tên)
export const getCategories = async () => (await call(axiosClient.get("/categories"))).categories;

// POST /categories { name, icon, color } -> { category }
export const createCategory = (body) => call(axiosClient.post("/categories", body));

// PUT /categories/:id
export const updateCategory = (id, body) => call(axiosClient.put(`/categories/${id}`, body));

// DELETE /categories/:id
// BR-04: danh mục đang có giao dịch thì không cho xóa (server sẽ lỗi 500 nếu cố xóa).
export async function deleteCategory(id) {
  const { pagination } = await getExpenses({ category_id: id, limit: 1 });
  if (pagination.total > 0) {
    throw new Error(
      `Danh mục đang được dùng bởi ${pagination.total} khoản chi tiêu. Hãy chuyển hoặc xóa các khoản chi đó trước khi xóa danh mục.`
    );
  }
  return call(axiosClient.delete(`/categories/${id}`));
}
