export const EMPLOYEE_ROLES: Record<string, string> = {
  VER: 'Verifikator',
  PPRBPD: 'Petugas Pembuat Rincian Biaya PD',
  OK: 'Operator Komitmen',
  BP: 'Bendahara Pengeluaran',
  OP: 'Operator Pembayaran',
  PPK: 'Pejabat Pembuat Komitmen',
  PPD: 'Pelaksana Perjalanan Dinas',
  ADK: 'Admin Digit Kemenkeu',
  KSBU: 'Kepala Sub Bagian Umum',
  PABPD: 'Petugas Arsip Berkas PD',
  OSPM: 'Operator SPM',
  OSPBy: 'Operator SPBy',
};

export const SYSTEM_ROLES: Record<string, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  employee: 'Pegawai',
};

export const STEP_ROLES: Record<number, string> = {
  1: 'VER',
  2: 'PPRBPD',
  3: 'OK',
  4: 'OSPM',
  5: 'OP',
  6: 'VER',
  7: 'PPRBPD',
  8: 'VER',
  9: 'OSPBy',
  10: 'BP',
  11: 'PPK',
  12: 'PPD',
  13: 'ADK',    // Khusus LS
  14: 'KSBU',
  15: 'PABPD',
};

// Steps that can be done in parallel for LS tickets (steps 1, 2, 3)
export const LS_PARALLEL_STEPS = [1, 2, 3];

// For Non-LS tickets, skip to step 6
export const NON_LS_START_STEP = 6;

// Step 13 (ADK) is only for LS tickets
export const LS_ONLY_STEPS = [13];

// Total steps
export const LS_TOTAL_STEPS = 15;
export const NON_LS_TOTAL_STEPS = 14; // skips 1-5 and 13
