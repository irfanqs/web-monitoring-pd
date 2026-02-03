# Monitoring Dashboard - Perjalanan Dinas

Sistem monitoring workflow perjalanan dinas dengan 14 step proses.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL

## Setup

### 1. Database

Pastikan PostgreSQL sudah terinstall dan buat database:

```sql
CREATE DATABASE monitoring_dashboard;
```

### 2. Backend

```bash
cd backend
npm install

# Edit .env dengan kredensial database Anda
# DATABASE_URL="postgresql://user:password@localhost:5432/monitoring_dashboard"

# Generate Prisma client & push schema
npm run db:generate
npm run db:push

# Seed dummy data
npm run db:seed

# Jalankan server
npm run dev
```

Backend akan berjalan di `http://localhost:5001`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## Dummy Users

### Admin & Supervisor
| Email | Password | Role |
|-------|----------|------|
| admin | admin123 | Admin |
| supervisor | super123 | Supervisor |

### Employee (Pegawai)
| Email | Password | Role | Step |
|-------|----------|------|------|
| verifikator | pass123 | Verifikator | 1, 6, 8 |
| pprbpd | pass123 | Petugas Pembuat Rincian Biaya PD | 2, 7 |
| ok | pass123 | Operator Komitmen | 3 |
| ospm | pass123 | Operator SPM | 4 |
| op | pass123 | Operator Pembayaran | 5 |
| ospby | pass123 | Operator SPBy | 9 |
| bp | pass123 | Bendahara Pengeluaran | 10 |
| ppk | pass123 | Pejabat Pembuat Komitmen | 11 |
| ptpd | pass123 | Pelaksana Perjalanan Dinas | 12 |
| adk | pass123 | Admin Digit Kemenkeu | Khusus LS |
| ksbu | pass123 | Kepala Sub Bagian Umum | 13 |
| pabpd | pass123 | Petugas Arsip Berkas PD | 14 |

## Workflow

### LS (Langsung)
- Step 1-3 dapat diproses secara **paralel** (tidak perlu menunggu)
- Setelah step 1-3 selesai, lanjut ke step 4
- File upload opsional untuk step 1-3

### Non-LS
- Langsung mulai dari **step 6** (skip step 1-5)

### Steps
1. Verifikator - Membuat rekapitulasi biaya perjalanan dinas
2. Petugas Pembuat Rincian Biaya PD - Membuat daftar nominatif
3. Operator Komitmen - Memasukkan nilai ke SAKTI
4. **Operator SPM** - Mengecek ketersediaan anggaran
5. Operator Pembayaran - Proses Pembayaran
6. Verifikator - Memeriksa kelengkapan berkas
7. Petugas Pembuat Rincian Biaya PD - Membuat rincian biaya
8. Verifikator - Memeriksa rincian biaya
9. **Operator SPBy** - Memeriksa selisih anggaran
10. Bendahara Pengeluaran - Menandatangani kuitansi
11. Pejabat Pembuat Komitmen (PPK) - Menandatangani kuitansi
12. Pelaksana Perjalanan Dinas - Menandatangani kuitansi
13. Kepala Sub Bagian Umum - Menandatangani kuitansi
14. Petugas Arsip Berkas PD - Mengarsipkan berkas
