const prisma = require("./src/lib/prisma");

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,

      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,

      amount NUMERIC(15, 2) NOT NULL,
      expense_date DATE NOT NULL,
      note VARCHAR(255),

      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT expenses_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      CONSTRAINT expenses_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

      CONSTRAINT expenses_amount_positive
        CHECK (amount > 0)
    )
  `);

  console.log("expenses table created successfully.");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
