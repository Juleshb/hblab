const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find all careers with old imageUrl path
  const careers = await prisma.carrier.findMany({
    where: {
      imageUrl: {
        startsWith: '/server/uploads/',
      },
    },
  });

  for (const career of careers) {
    const newUrl = career.imageUrl.replace('/server/uploads/', '/uploads/');
    await prisma.carrier.update({
      where: { id: career.id },
      data: { imageUrl: newUrl },
    });
    console.log(`Updated career ${career.id}: ${career.imageUrl} -> ${newUrl}`);
  }

  console.log('Done updating image paths!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 