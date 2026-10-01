const prisma = require("./src/lib/prisma");

async function main() {
  const users = await prisma.users.findMany({
    select: {
      email: true,
    },
  });

  console.log(users);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
