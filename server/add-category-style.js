const prisma = require("./src/lib/prisma");

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS icon VARCHAR(50) NULL
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS color VARCHAR(20) NULL
  `);

  console.log("Category style columns added successfully.");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });