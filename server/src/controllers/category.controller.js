const prisma = require("../lib/prisma");

// ================================
// Helper functions
// ================================

// Validate positive integer
function parsePositiveInt(value) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : null;
}

// Validate category name
function validateCategoryName(name) {
  if (typeof name !== "string" || !name.trim()) {
    return {
      valid: false,
      message: "Category name is required",
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length > 100) {
    return {
      valid: false,
      message: "Category name must not exceed 100 characters",
    };
  }

  return {
    valid: true,
    value: trimmedName,
  };
}

// Validate optional icon and color
function validateOptionalFields(icon, color) {
  if (
    icon !== undefined &&
    icon !== null &&
    (typeof icon !== "string" || icon.length > 50)
  ) {
    return {
      valid: false,
      message: "Icon must be a string with at most 50 characters",
    };
  }

  if (
    color !== undefined &&
    color !== null &&
    (typeof color !== "string" || color.length > 20)
  ) {
    return {
      valid: false,
      message: "Color must be a string with at most 20 characters",
    };
  }

  return { valid: true };
}

// Check whether a category name already exists
async function isCategoryNameTaken(name, userId, excludeId = null) {
  const existingCategory = await prisma.categories.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
      OR: [
        { is_default: true },
        { user_id: userId },
      ],
      ...(excludeId !== null
        ? {
            id: {
              not: excludeId,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  return Boolean(existingCategory);
}

// ================================
// GET CATEGORIES
// ================================

const getCategories = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const categories = await prisma.categories.findMany({
      where: {
        OR: [
          { is_default: true },
          { user_id: userId },
        ],
      },
      orderBy: [
        { is_default: "desc" },
        { name: "asc" },
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

// ================================
// CREATE CATEGORY
// ================================

const createCategory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { name, icon, color } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Validate name
    const nameValidation = validateCategoryName(name);

    if (!nameValidation.valid) {
      return res.status(400).json({
        message: nameValidation.message,
      });
    }

    const trimmedName = nameValidation.value;

    // Validate icon and color
    const optionalValidation = validateOptionalFields(icon, color);

    if (!optionalValidation.valid) {
      return res.status(400).json({
        message: optionalValidation.message,
      });
    }

    // Check duplicate category name
    const nameTaken = await isCategoryNameTaken(
      trimmedName,
      userId
    );

    if (nameTaken) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // Create category
    const category = await prisma.categories.create({
      data: {
        user_id: userId,
        name: trimmedName,
        is_default: false,
        icon: icon?.trim() || null,
        color: color?.trim() || null,
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

// ================================
// UPDATE CATEGORY
// ================================

const updateCategory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const categoryId = parsePositiveInt(req.params.id);

    const { name, icon, color } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    // Validate name
    const nameValidation = validateCategoryName(name);

    if (!nameValidation.valid) {
      return res.status(400).json({
        message: nameValidation.message,
      });
    }

    const trimmedName = nameValidation.value;

    // Validate icon and color
    const optionalValidation = validateOptionalFields(icon, color);

    if (!optionalValidation.valid) {
      return res.status(400).json({
        message: optionalValidation.message,
      });
    }

    // Find category belonging to current user
    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        user_id: userId,
        is_default: false,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // Check duplicate name
    const nameTaken = await isCategoryNameTaken(
      trimmedName,
      userId,
      categoryId
    );

    if (nameTaken) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // Update category
    const updatedCategory = await prisma.categories.updateMany({
      where: {
        id: categoryId,
        user_id: userId,
        is_default: false,
      },
      data: {
        name: trimmedName,
        icon:
          icon !== undefined
            ? icon?.trim() || null
            : category.icon,
        color:
          color !== undefined
            ? color?.trim() || null
            : category.color,
        updated_at: new Date(),
      },
    });

    if (updatedCategory.count === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const result = await prisma.categories.findUnique({
      where: {
        id: categoryId,
      },
    });

    return res.status(200).json({
      message: "Category updated successfully",
      category: result,
    });
  } catch (error) {
    console.error("Update category error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ================================
// DELETE CATEGORY
// ================================

const deleteCategory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const categoryId = parsePositiveInt(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    // Find category belonging to current user
    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        user_id: userId,
        is_default: false,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // Delete category
    await prisma.categories.deleteMany({
      where: {
        id: categoryId,
        user_id: userId,
        is_default: false,
      },
    });

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    // Category is being referenced by expenses, incomes or budgets
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "Cannot delete category because it is being used",
      });
    }

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