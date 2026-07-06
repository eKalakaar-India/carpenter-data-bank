import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const totalAll = await prisma.record.count();
  const totalActive = await prisma.record.count({ where: { isDeleted: false } });
  const totalDeleted = await prisma.record.count({ where: { isDeleted: true } });
  
  console.log(`Total records in DB: ${totalAll}`);
  console.log(`Active (isDeleted=false): ${totalActive}`);
  console.log(`Deleted (isDeleted=true): ${totalDeleted}`);
  
  // Show first 3 active records
  const sample = await prisma.record.findMany({ 
    where: { isDeleted: false }, 
    take: 3,
    orderBy: { srNo: 'asc' }
  });
  
  console.log('\n--- Sample Active Records ---');
  sample.forEach((r, i) => {
    console.log(`\nRecord ${i+1}:`);
    console.log(`  id: ${r.id}`);
    console.log(`  srNo: ${r.srNo}`);
    console.log(`  fullName: "${r.fullName}"`);
    console.log(`  nameOfCarpenter: "${r.nameOfCarpenter}"`);
    console.log(`  category: "${r.category}"`);
    console.log(`  state: "${r.state}"`);
    console.log(`  isDeleted: ${r.isDeleted}`);
    console.log(`  enrollmentDate: "${r.enrollmentDate}"`);
    console.log(`  salutation: "${r.salutation}"`);
  });

  // Show first 3 deleted records too
  const deleted = await prisma.record.findMany({ 
    where: { isDeleted: true }, 
    take: 3,
    orderBy: { createdAt: 'desc' }
  });
  
  if (deleted.length > 0) {
    console.log('\n--- Sample Deleted Records ---');
    deleted.forEach((r, i) => {
      console.log(`\nDeleted Record ${i+1}:`);
      console.log(`  id: ${r.id}`);
      console.log(`  srNo: ${r.srNo}`);
      console.log(`  fullName: "${r.fullName}"`);
      console.log(`  nameOfCarpenter: "${r.nameOfCarpenter}"`);
      console.log(`  isDeleted: ${r.isDeleted}`);
    });
  }

  // Check imports table
  const imports = await prisma.import.findMany({ orderBy: { createdAt: 'desc' }, take: 3 });
  console.log('\n--- Recent Import Logs ---');
  imports.forEach((imp, i) => {
    console.log(`\nImport ${i+1}:`);
    console.log(`  fileName: ${imp.fileName}`);
    console.log(`  totalRows: ${imp.totalRows}`);
    console.log(`  successfullyImported: ${imp.successfullyImported}`);
    console.log(`  failedRows: ${imp.failedRows}`);
    console.log(`  duplicateRows: ${imp.duplicateRows}`);
    console.log(`  status: ${imp.status}`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
