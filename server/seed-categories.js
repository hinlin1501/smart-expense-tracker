const prisma = require("./src/lib/prisma");

const defaultCategories = [
  "Ăn uống",
  "Di chuyển",
  "Mua sắm",
  "Hóa đơn",
  "Giải trí",
  "Sức khỏe",
  "Giáo dục",
  "Khác",
];

async function main() {
  for (const name of defaultCategories) {
    const existingCategory = await prisma.categories.findFirst({
      where: {
        name,
        user_id: null,
        is_default: true,
      },
    });

    if (!existingCategory) {
      await prisma.categories.create({
        data: {
          name,
          user_id: null,
          is_default: true,
        },
      });
    }
  }

  console.log("Default categories created successfully.");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
