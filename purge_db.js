import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Delete all records
  const deleted = await prisma.record.deleteMany({});
  console.log(`Purged ${deleted.count} records from database.`);
  
  // Also clear import logs
  const imports = await prisma.import.deleteMany({});
  console.log(`Purged ${imports.count} import logs.`);

  // Clear all users
  const users = await prisma.user.deleteMany({});
  console.log(`Purged ${users.count} users from database.`);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
