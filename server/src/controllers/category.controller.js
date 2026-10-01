const prisma = require("../lib/prisma");

const getCategories = async (req, res) => {
  try {
    const userId = req.user.userId;

    const categories = await prisma.categories.findMany({
      where: {
        OR: [
          {
            is_default: true,
          },
          {
            user_id: userId,
          },
        ],
      },
      orderBy: [
        {
          is_default: "desc",
        },
        {
          name: "asc",
        },
      ],
    });

    return res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, icon, color } = req.body;

    // Kiểm tra tên danh mục
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const trimmedName = name.trim();

    // Kiểm tra độ dài tên
    if (trimmedName.length > 100) {
      return res.status(400).json({
        message: "Category name must not exceed 100 characters",
      });
    }

    // Kiểm tra trùng với danh mục mặc định
    const defaultCategory = await prisma.categories.findFirst({
      where: {
        name: trimmedName,
        is_default: true,
      },
    });

    if (defaultCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // Kiểm tra trùng với danh mục cá nhân của user
    const userCategory = await prisma.categories.findFirst({
      where: {
        name: trimmedName,
        user_id: userId,
      },
    });

    if (userCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // Tạo danh mục mới
    const category = await prisma.categories.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        name: trimmedName,
        is_default: false,
        icon: icon || null,
        color: color || null,
      },
    });

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const categoryId = Number(req.params.id);
    const { name, icon, color } = req.body;

    // Kiểm tra category ID
    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    // Kiểm tra tên
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      return res.status(400).json({
        message: "Category name must not exceed 100 characters",
      });
    }

    // Chỉ tìm category thuộc user hiện tại
    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        user_id: userId,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // Kiểm tra tên trùng với category mặc định
    const defaultCategory = await prisma.categories.findFirst({
      where: {
        name: trimmedName,
        is_default: true,
      },
    });

    if (defaultCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // Kiểm tra tên trùng với category khác của user
    const existingCategory = await prisma.categories.findFirst({
      where: {
        name: trimmedName,
        user_id: userId,
        id: {
          not: categoryId,
        },
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // Cập nhật category
    const updatedCategory = await prisma.categories.update({
      where: {
        id: categoryId,
      },
      data: {
        name: trimmedName,
        icon: icon || null,
        color: color || null,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update category error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const categoryId = Number(req.params.id);

    // Kiểm tra category ID
    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    // Chỉ tìm category thuộc user hiện tại
    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        user_id: userId,
      },
    });

    // Không tìm thấy category thuộc user
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // Không cho xóa category mặc định
    if (category.is_default) {
      return res.status(403).json({
        message: "Default category cannot be deleted",
      });
    }

    // Xóa category
    await prisma.categories.delete({
      where: {
        id: categoryId,
      },
    });

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};