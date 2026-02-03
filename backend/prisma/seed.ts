import { PrismaClient, SystemRole, EmployeeRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashPassword = async (password: string) => bcrypt.hash(password, 10);

  const users = [
    { username: 'admin', password: await hashPassword('admin123'), name: 'Admin User', systemRole: SystemRole.admin, employeeRole: null },
    { username: 'supervisor', password: await hashPassword('super123'), name: 'Supervisor User', systemRole: SystemRole.supervisor, employeeRole: null },
    { username: 'verifikator', password: await hashPassword('pass123'), name: 'Kusmono', systemRole: SystemRole.employee, employeeRole: EmployeeRole.VER },
    { username: 'pprbpd1', password: await hashPassword('pass123'), name: 'Ilham', systemRole: SystemRole.employee, employeeRole: EmployeeRole.PPRBPD },
    { username: 'pprbpd2', password: await hashPassword('pass123'), name: 'Ratih', systemRole: SystemRole.employee, employeeRole: EmployeeRole.PPRBPD },
    { username: 'opkomitmen', password: await hashPassword('pass123'), name: 'Mami', systemRole: SystemRole.employee, employeeRole: EmployeeRole.OK },
    { username: 'ospm', password: await hashPassword('pass123'), name: 'Operator SPM User', systemRole: SystemRole.employee, employeeRole: EmployeeRole.OSPM },
    { username: 'op', password: await hashPassword('pass123'), name: '-', systemRole: SystemRole.employee, employeeRole: EmployeeRole.OP },
    { username: 'ospby', password: await hashPassword('pass123'), name: 'Operator SPBy User', systemRole: SystemRole.employee, employeeRole: EmployeeRole.OSPBy },
    { username: 'bendahara', password: await hashPassword('pass123'), name: 'Salma', systemRole: SystemRole.employee, employeeRole: EmployeeRole.BP },
    { username: 'ppk', password: await hashPassword('pass123'), name: 'Asbari', systemRole: SystemRole.employee, employeeRole: EmployeeRole.PPK },
    { username: 'ppd', password: await hashPassword('pass123'), name: '-', systemRole: SystemRole.employee, employeeRole: EmployeeRole.PPD },
    { username: 'adk', password: await hashPassword('pass123'), name: 'Putri', systemRole: SystemRole.employee, employeeRole: EmployeeRole.ADK },
    { username: 'ksbu', password: await hashPassword('pass123'), name: 'Sutrisno', systemRole: SystemRole.employee, employeeRole: EmployeeRole.KSBU },
    { username: 'arsip', password: await hashPassword('pass123'), name: 'Ilham', systemRole: SystemRole.employee, employeeRole: EmployeeRole.PABPD },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
  }

  const steps = [
    { stepNumber: 1, stepName: 'Verifikator', requiredEmployeeRole: EmployeeRole.VER, description: 'Membuat rekapitulasi biaya perjalanan dinas berdasarkan Surat Tugas dan Nota Dinas Anggaran', isLsOnly: true, isNonLsOnly: false, isParallel: true, parallelGroup: 'A' },
    { stepNumber: 2, stepName: 'Petugas Pembuat Rincian Biaya PD', requiredEmployeeRole: EmployeeRole.PPRBPD, description: 'Membuat daftar nominatif biaya perjalanan dinas', isLsOnly: true, isNonLsOnly: false, isParallel: true, parallelGroup: 'A' },
    { stepNumber: 3, stepName: 'Operator Komitmen', requiredEmployeeRole: EmployeeRole.OK, description: 'Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI', isLsOnly: true, isNonLsOnly: false, isParallel: true, parallelGroup: 'A' },
    { stepNumber: 4, stepName: 'Operator SPM', requiredEmployeeRole: EmployeeRole.OSPM, description: 'Mengecek ketersediaan anggaran', isLsOnly: true, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 5, stepName: 'Operator Pembayaran', requiredEmployeeRole: EmployeeRole.OP, description: 'Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI', isLsOnly: true, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 6, stepName: 'Verifikator', requiredEmployeeRole: EmployeeRole.VER, description: 'Memeriksa kelengkapan berkas perjalanan dinas dari pelaksana perjalanan dinas. Pilih status selisih: Nihil/Kurang/Lebih', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 7, stepName: 'Petugas Pembuat Rincian Biaya PD', requiredEmployeeRole: EmployeeRole.PPRBPD, description: 'Membuat rincian biaya perjalanan dinas', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 8, stepName: 'Verifikator', requiredEmployeeRole: EmployeeRole.VER, description: 'Memeriksa rincian biaya perjalanan dinas', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 9, stepName: 'Operator SPBy', requiredEmployeeRole: EmployeeRole.OSPBy, description: 'Memeriksa rincian biaya perjalanan dinas dibandingkan dengan permohonan anggaran biaya awal apakah ada selisih lebih untuk pengembalian atau tidak', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 10, stepName: 'Bendahara Pengeluaran', requiredEmployeeRole: EmployeeRole.BP, description: 'Menandatangani kuitansi dll berkas perjalanan dinas', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 11, stepName: 'Pejabat Pembuat Komitmen', requiredEmployeeRole: EmployeeRole.PPK, description: 'Menandatangani kuitansi dll berkas perjalanan dinas', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 12, stepName: 'Pelaksana Perjalanan Dinas', requiredEmployeeRole: EmployeeRole.PPD, description: 'Menandatangani kuitansi dll berkas perjalanan dinas', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 13, stepName: 'Admin Digit Kemenkeu', requiredEmployeeRole: EmployeeRole.ADK, description: 'Melakukan pengembalian selisih kelebihan anggaran ke MPN G3 Modul Penerimaan Negara versi G3 (Khusus LS)', isLsOnly: true, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 14, stepName: 'Kepala Sub Bagian Umum', requiredEmployeeRole: EmployeeRole.KSBU, description: 'Menandatangani kuitansi dll berkas perjalanan dinas', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
    { stepNumber: 15, stepName: 'Petugas Arsip Berkas PD', requiredEmployeeRole: EmployeeRole.PABPD, description: 'Mengarsipkan kuitansi dll berkas perjalanan dinas', isLsOnly: false, isNonLsOnly: false, isParallel: false, parallelGroup: null },
  ];

  for (const step of steps) {
    await prisma.stepConfiguration.upsert({
      where: { stepNumber: step.stepNumber },
      update: {
        stepName: step.stepName,
        requiredEmployeeRole: step.requiredEmployeeRole,
        description: step.description,
        isLsOnly: step.isLsOnly,
        isNonLsOnly: step.isNonLsOnly,
        isParallel: step.isParallel,
        parallelGroup: step.parallelGroup,
      },
      create: step,
    });
  }

  console.log('Seed completed!');

  // Create dummy archived tickets for 2025
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  
  if (adminUser) {
    const dummyTickets = [
      {
        ticketNumber: 'PD-202501',
        activityName: 'Perjalanan Dinas Monitoring Frekuensi 2025',
        assignmentLetterNumber: 'ST/001/2025',
        startDate: new Date('2025-03-15'),
        isLs: true,
        currentStep: 16,
        status: 'completed' as const,
        createdById: adminUser.id,
        createdAt: new Date('2025-03-15'),
      },
      {
        ticketNumber: 'PD-202502',
        activityName: 'Survei Infrastruktur Telekomunikasi 2025',
        assignmentLetterNumber: 'ST/002/2025',
        startDate: new Date('2025-05-20'),
        isLs: false,
        currentStep: 16,
        status: 'completed' as const,
        createdById: adminUser.id,
        createdAt: new Date('2025-05-20'),
      },
      {
        ticketNumber: 'PD-202503',
        activityName: 'Koordinasi Penertiban Spektrum 2025',
        assignmentLetterNumber: 'ST/003/2025',
        startDate: new Date('2025-08-10'),
        isLs: true,
        currentStep: 16,
        status: 'completed' as const,
        createdById: adminUser.id,
        createdAt: new Date('2025-08-10'),
      },
    ];

    for (const ticket of dummyTickets) {
      await prisma.ticket.upsert({
        where: { ticketNumber: ticket.ticketNumber },
        update: {},
        create: ticket,
      });
    }
    console.log('Dummy 2025 tickets created!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
