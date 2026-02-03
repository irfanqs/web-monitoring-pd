# Product Requirements Document (PRD)
## Sistem Monitoring Dashboard Perjalanan Dinas

---

## 1. Ringkasan Produk

### 1.1 Tujuan
Membangun web-based monitoring dashboard untuk melacak dan mengelola proses administrasi perjalanan dinas dengan workflow yang terstruktur dan transparan.

### 1.2 Tech Stack
- **Frontend**: Next.js (TypeScript)
- **Backend**: Express.js (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT-based authentication
- **UI Components**: Tailwind CSS + shadcn/ui

---

## 2. User Roles

### 2.1 System Roles (3 Role Utama)
| Role | Deskripsi |
|------|-----------|
| **Admin** | Membuat tiket baru, monitoring seluruh proses |
| **Supervisor** | Monitoring seluruh proses tanpa aksi operasional |
| **Employee** | Memproses tiket sesuai role spesifik |

### 2.2 Employee Roles (10 Role Pegawai)
| No | Role | Kode |
|----|------|------|
| 1 | Verifikator | VER |
| 2 | Petugas Pembuat Rincian Biaya Perjalanan Dinas | PPRBPD |
| 3 | Operator Komitmen | OK |
| 4 | Bendahara Pengeluaran | BP |
| 5 | Operator Pembayaran | OP |
| 6 | Pejabat Pembuat Komitmen (PPK) | PPK |
| 7 | Pelaksana Perjalanan Dinas | PTPD |
| 8 | Admin Digit Kemenkeu (Khusus Pembayaran LS) | ADK |
| 9 | Kepala Sub Bagian Umum | KSBU |
| 10 | Petugas Arsip Berkas Perjalanan Dinas | PABPD |

---

## 3. Workflow Tiket

### 3.1 Data Tiket (Input Admin)
| Field | Tipe | Keterangan |
|-------|------|------------|
| Nama Kegiatan | String | Nama kegiatan perjalanan dinas |
| Nomor Surat Tugas | String | Nomor surat tugas resmi |
| Tanggal Terima Kelengkapan Berkas | Date | Tanggal dokumen diterima |
| LS/Non-LS | Boolean | Yes = LS, No = Non-LS |

### 3.2 Alur Workflow (15 Steps)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW PERJALANAN DINAS                         │
└─────────────────────────────────────────────────────────────────────────────┘

[ADMIN] ──► Buat Tiket

    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1  │ Verifikator                                        │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 2  │ Petugas Pembuat Rincian Biaya Perjalanan Dinas     │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 3  │ Operator Komitmen                                  │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 4  │ Bendahara Pengeluaran                              │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 5  │ Operator Pembayaran                                │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 6  │ Verifikator                                        │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 7  │ Petugas Pembuat Rincian Biaya Perjalanan Dinas     │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 8  │ Verifikator                                        │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 9  │ Operator Komitmen                                  │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 10 │ Bendahara Pengeluaran                              │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 11 │ Pejabat Pembuat Komitmen (PPK)                     │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 12 │ Pelaksana Perjalanan Dinas                         │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 13 │ Kepala Sub Bagian Umum                             │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 14 │ Petugas Arsip Berkas Perjalanan Dinas              │ Upload File │
├─────────────────────────────────────────────────────────────────────────────┤
│ STEP 15 │ SELESAI                                            │ ✓ Complete  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Detail Step Workflow

| Step | Role yang Bertanggung Jawab | Aksi |
|------|----------------------------|------|
| 1 | Verifikator | Verifikasi awal, upload dokumen |
| 2 | Petugas Pembuat Rincian Biaya PD | Buat rincian biaya, upload dokumen |
| 3 | Operator Komitmen | Proses komitmen, upload dokumen |
| 4 | Bendahara Pengeluaran | Proses pengeluaran, upload dokumen |
| 5 | Operator Pembayaran | Proses pembayaran, upload dokumen |
| 6 | Verifikator | Verifikasi kedua, upload dokumen |
| 7 | Petugas Pembuat Rincian Biaya PD | Update rincian, upload dokumen |
| 8 | Verifikator | Verifikasi ketiga, upload dokumen |
| 9 | Operator Komitmen | Finalisasi komitmen, upload dokumen |
| 10 | Bendahara Pengeluaran | Finalisasi pengeluaran, upload dokumen |
| 11 | Pejabat Pembuat Komitmen (PPK) | Approval PPK, upload dokumen |
| 12 | Pelaksana Perjalanan Dinas | Konfirmasi pelaksanaan, upload dokumen |
| 13 | Kepala Sub Bagian Umum | Approval KSBU, upload dokumen |
| 14 | Petugas Arsip Berkas PD | Arsip dokumen, upload dokumen |
| 15 | - | Tiket selesai (COMPLETED) |

---

## 4. Fitur Utama

### 4.1 Fitur Admin
- [ ] Login/Logout
- [ ] Membuat tiket baru
- [ ] Melihat daftar semua tiket
- [ ] Monitoring progress tiket (step berapa)
- [ ] Melihat detail tiket dan history
- [ ] Melihat file yang diupload setiap step
- [ ] Manajemen user (CRUD employee)

### 4.2 Fitur Supervisor
- [ ] Login/Logout
- [ ] Melihat daftar semua tiket
- [ ] Monitoring progress tiket (step berapa)
- [ ] Melihat detail tiket dan history
- [ ] Melihat file yang diupload setiap step
- [ ] Dashboard statistik

### 4.3 Fitur Employee
- [ ] Login/Logout
- [ ] Melihat tiket yang perlu diproses (sesuai role & step)
- [ ] Download file dari step sebelumnya
- [ ] Memproses tiket (upload file + submit)
- [ ] Melihat history tiket yang sudah diproses

---

## 5. Database Schema

### 5.1 Tabel Users
```sql
users
├── id (PK)
├── email
├── password (hashed)
├── name
├── system_role (admin/supervisor/employee)
├── employee_role (nullable, untuk employee)
├── created_at
└── updated_at
```

### 5.2 Tabel Tickets
```sql
tickets
├── id (PK)
├── ticket_number (auto-generated)
├── activity_name (nama kegiatan)
├── assignment_letter_number (nomor surat tugas)
├── document_received_date (tanggal terima kelengkapan berkas)
├── is_ls (boolean: LS/Non-LS)
├── current_step (1-15)
├── status (pending/in_progress/completed)
├── created_by (FK -> users)
├── created_at
└── updated_at
```

### 5.3 Tabel Ticket History
```sql
ticket_histories
├── id (PK)
├── ticket_id (FK -> tickets)
├── step_number (1-14)
├── processed_by (FK -> users)
├── processor_name (nama pegawai yang memproses)
├── file_url
├── notes (optional)
├── processed_at (timestamp: tanggal + waktu spesifik)
└── created_at
```

### 5.4 Tabel Step Configuration
```sql
step_configurations
├── id (PK)
├── step_number (1-14)
├── step_name
├── required_employee_role
└── description
```

---

## 6. API Endpoints

### 6.1 Authentication
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /api/auth/login | Login user |
| POST | /api/auth/logout | Logout user |
| GET | /api/auth/me | Get current user |

### 6.2 Tickets
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/tickets | List semua tiket |
| GET | /api/tickets/:id | Detail tiket + semua file history |
| POST | /api/tickets | Buat tiket baru (Admin) |
| GET | /api/tickets/my-tasks | Tiket yang perlu diproses (Employee) |
| POST | /api/tickets/:id/process | Proses tiket + upload file |
| GET | /api/tickets/:id/files | List semua file dari step sebelumnya |
| GET | /api/tickets/:id/files/:fileId/download | Download file spesifik |

### 6.3 Users (Admin Only)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/users | List semua user |
| POST | /api/users | Buat user baru |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Hapus user |

### 6.4 Dashboard
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/dashboard/stats | Statistik tiket |

---

## 7. UI/UX Requirements

### 7.1 Layout Utama
- **Sidebar Navigation** (di sebelah kiri)
  - Logo/Brand
  - Menu navigasi sesuai role
  - User info & logout
- **Main Content Area** (di sebelah kanan)
- **Responsive**: Sidebar collapse di mobile

### 7.2 Halaman
- Login page
- Dashboard (berbeda view per role)

### 7.3 Dashboard Admin
- Statistik tiket (total, in progress, completed)
- Tabel tiket dengan filter & search
- Button "Buat Tiket Baru"
- Progress indicator per tiket (step 1-15)

### 7.4 Dashboard Supervisor
- Statistik tiket
- Tabel tiket dengan filter & search
- Progress indicator per tiket
- View-only (tidak ada aksi)

### 7.5 Dashboard Employee
- Daftar tiket yang perlu diproses
- Form upload file
- History tiket yang sudah diproses

### 7.6 Progress Indicator
```
Step: [1]─[2]─[3]─[4]─[5]─[6]─[7]─[8]─[9]─[10]─[11]─[12]─[13]─[14]─[✓]
       ●───●───●───●───○───○───○───○───○────○────○────○────○────○───○
       ▲
    Current Step (4)
    
Legend:
● = Completed (dengan timestamp & nama processor)siap
○ = Pending
```

### 7.7 Detail History per Step
Setiap step yang sudah selesai menampilkan:
- Nomor step
- Nama role
- **Nama pegawai** yang memproses
- **Tanggal & waktu spesifik** (format: DD/MM/YYYY HH:mm)
- File yang diupload (downloadable)

---

## 8. Non-Functional Requirements

### 8.1 Security
- Password hashing (bcrypt)
- JWT token dengan expiry
- Role-based access control
- File upload validation

### 8.2 Performance
- Pagination untuk list tiket
- Lazy loading untuk file preview
- Optimized database queries

### 8.3 Scalability
- Stateless backend
- Cloud storage untuk file (S3/GCS compatible)

---

## 9. Timeline Estimasi

| Phase | Durasi | Deliverable |
|-------|--------|-------------|
| Phase 1 | 1 minggu | Setup project, Auth, Database |
| Phase 2 | 1 minggu | CRUD Tickets, Workflow logic |
| Phase 3 | 1 minggu | File upload, Dashboard UI |
| Phase 4 | 1 minggu | Testing, Bug fixing, Deployment |

**Total: 4 minggu**

---

## 10. Catatan Khusus

1. **Admin Digit Kemenkeu** hanya aktif jika tiket bertipe **LS** (is_ls = true)
2. Setiap step **wajib** upload minimal 1 file
3. Tiket tidak bisa di-skip, harus sequential
4. History tiket tersimpan permanen untuk audit trail
5. **File Sharing antar Step**: File yang diupload pada step sebelumnya dapat didownload oleh step selanjutnya untuk referensi dan kelanjutan proses

---

## 11. Dummy Data (Seed)

### 11.1 Dummy Users
| Email | Password | System Role | Employee Role | Name |
|-------|----------|-------------|---------------|------|
| admin@mail.com | admin123 | admin | - | Admin User |
| supervisor@mail.com | super123 | supervisor | - | Supervisor User |
| verifikator@mail.com | pass123 | employee | VER | [Nama Verifikator] |
| pprbpd@mail.com | pass123 | employee | PPRBPD | [Nama Petugas Rincian] |
| ok@mail.com | pass123 | employee | OK | [Nama Operator Komitmen] |
| bp@mail.com | pass123 | employee | BP | [Nama Bendahara] |
| op@mail.com | pass123 | employee | OP | [Nama Operator Pembayaran] |
| ppk@mail.com | pass123 | employee | PPK | [Nama PPK] |
| ptpd@mail.com | pass123 | employee | PTPD | [Nama Pelaksana] |
| adk@mail.com | pass123 | employee | ADK | [Nama Admin Digit] |
| ksbu@mail.com | pass123 | employee | KSBU | [Nama Kepala Sub Bagian] |
| pabpd@mail.com | pass123 | employee | PABPD | [Nama Petugas Arsip] |

*Nama dapat diisi manual sesuai kebutuhan*

---

*Dokumen ini akan diupdate sesuai kebutuhan development.*
