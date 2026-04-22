import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script untuk membersihkan activityName yang mengandung newline atau multiple spaces
 * Jalankan dengan: npx ts-node scripts/clean-activity-names.ts
 */
async function cleanActivityNames() {
  console.log('🔍 Mencari tickets dengan activityName yang perlu dibersihkan...');

  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      activityName: true,
      ticketNumber: true,
    },
  });

  console.log(`📊 Total tickets: ${tickets.length}`);

  let updatedCount = 0;
  let unchangedCount = 0;

  for (const ticket of tickets) {
    // Normalize whitespace: replace all whitespace characters (including newlines, tabs) with single space
    const cleanedName = ticket.activityName.replace(/\s+/g, ' ').trim();

    if (cleanedName !== ticket.activityName) {
      console.log(`\n🔧 Membersihkan ticket ${ticket.ticketNumber}:`);
      console.log(`   Sebelum: "${ticket.activityName}"`);
      console.log(`   Sesudah: "${cleanedName}"`);

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { activityName: cleanedName },
      });

      updatedCount++;
    } else {
      unchangedCount++;
    }
  }

  console.log('\n✅ Selesai!');
  console.log(`   - Tickets yang diupdate: ${updatedCount}`);
  console.log(`   - Tickets yang tidak berubah: ${unchangedCount}`);
}

cleanActivityNames()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
