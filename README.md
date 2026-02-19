# Monitoring Dashboard - Perjalanan Dinas

Sistem monitoring workflow perjalanan dinas dengan 15 step proses.

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
| Username | Password | Name | Role |
|----------|----------|------|------|
| admin | admin123 | Admin User | Admin |
| supervisor | super123 | Supervisor User | Supervisor |

### Employee (Pegawai)
| Username | Password | Name | Role | Step |
|----------|----------|------|------|------|
| verifikator | pass123 | Kusmono | Verifikator | 1, 6, 8 |
| ilhampd | pass123 | Ilham | Petugas Pembuat Rincian Biaya PD | 2, 7 |
| ratih | pass123 | Ratih | Petugas Pembuat Rincian Biaya PD | 2, 7 |
| mami | pass123 | Mami | Operator Komitmen | 3 |
| ospm | pass123 | Operator SPM User | Operator SPM | 4 |
| op | pass123 | - | Operator Pembayaran | 5 |
| ospby | pass123 | Operator SPBy User | Operator SPBy | 9 |
| salma | pass123 | Salma | Bendahara Pengeluaran | 10 |
| asbari | pass123 | Asbari | Pejabat Pembuat Komitmen | 11 |
| ppd | pass123 | user1 | Pelaksana Perjalanan Dinas | 12 |
| ppd2 | pass123 | user2 | Pelaksana Perjalanan Dinas | 12 |
| putri | pass123 | Putri | Admin Digit Kemenkeu | 13 (Khusus LS) |
| sutrisno | pass123 | Sutrisno | Kepala Sub Bagian Umum | 14 |
| ilhamarsip | pass123 | Ilham | Petugas Arsip Berkas PD | 15 |

## Workflow

### LS (Langsung)
- Step 1-3 dapat diproses secara **paralel** (tidak perlu menunggu)
- Setelah step 1-3 selesai, lanjut ke step 4
- Step 13 khusus untuk LS saja
- Total 15 step

### Non-LS
- Langsung mulai dari **step 6** (skip step 1-5 dan 13)
- Total 9 step (6-12, 14-15)

### Steps Detail
1. **Verifikator** - Membuat rekapitulasi biaya perjalanan dinas berdasarkan Surat Tugas dan Nota Dinas Anggaran *(LS Only, Paralel)*
2. **Petugas Pembuat Rincian Biaya PD** - Membuat daftar nominatif biaya perjalanan dinas *(LS Only, Paralel)*
3. **Operator Komitmen** - Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI *(LS Only, Paralel)*
4. **Operator SPM** - Mengecek ketersediaan anggaran *(LS Only)*
5. **Operator Pembayaran** - Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI *(LS Only)*
6. **Verifikator** - Memeriksa kelengkapan berkas perjalanan dinas dari pelaksana perjalanan dinas. Pilih status selisih: Nihil/Kurang/Lebih
7. **Petugas Pembuat Rincian Biaya PD** - Membuat rincian biaya perjalanan dinas
8. **Verifikator** - Memeriksa rincian biaya perjalanan dinas
9. **Operator SPBy** - Memeriksa rincian biaya perjalanan dinas dibandingkan dengan permohonan anggaran biaya awal apakah ada selisih lebih untuk pengembalian atau tidak
10. **Bendahara Pengeluaran** - Menandatangani kuitansi dll berkas perjalanan dinas
11. **Pejabat Pembuat Komitmen** - Menandatangani kuitansi dll berkas perjalanan dinas
12. **Pelaksana Perjalanan Dinas** - Menandatangani kuitansi dll berkas perjalanan dinas
13. **Admin Digit Kemenkeu** - Melakukan pengembalian selisih kelebihan anggaran ke MPN G3 Modul Penerimaan Negara versi G3 *(Khusus LS)*
14. **Kepala Sub Bagian Umum** - Menandatangani kuitansi dll berkas perjalanan dinas
15. **Petugas Arsip Berkas PD** - Mengarsipkan kuitansi dll berkas perjalanan dinas

## Features

- **Dashboard** - Overview statistik PD
- **PD Aktif** - Monitoring PD yang sedang berjalan
- **Arsip** - PD yang sudah selesai (per tahun)
- **Tugas Saya** - Task list untuk employee
- **Manajemen User** - CRUD users (Admin only)
- **Pengaturan Step** - Konfigurasi workflow (Admin only)
- **Pengaturan Lanjutan** - Template nomor surat (Admin only)
- **Filter & Sort** - Pencarian dan pengurutan data
- **File Upload** - Upload dokumen per step
- **Progress Tracking** - Visual progress indicator
- **Role-based Access** - Akses berdasarkan role user
