# Scripts Utilitas Backend

## clean-activity-names.ts

Script untuk membersihkan data `activityName` di database yang mengandung karakter newline atau multiple spaces yang menyebabkan tampilan teks menyambung.

### Kapan Menggunakan Script Ini?

Gunakan script ini jika:
- Terdapat data PD lama yang judulnya menyambung atau mengandung whitespace yang tidak normal
- Setelah memperbaiki bug input di frontend, untuk membersihkan data yang sudah ada

### Cara Menjalankan

1. Pastikan Anda berada di direktori `backend/`
2. Jalankan perintah:

```bash
npx ts-node scripts/clean-activity-names.ts
```

### Apa yang Dilakukan Script Ini?

Script ini akan:
1. Mengambil semua ticket dari database
2. Memeriksa setiap `activityName`
3. Mengganti semua whitespace characters (newline, tab, multiple spaces) dengan single space
4. Melakukan trim untuk menghapus whitespace di awal dan akhir
5. Update database jika ada perubahan
6. Menampilkan laporan jumlah tickets yang diupdate

### Output Contoh

```
🔍 Mencari tickets dengan activityName yang perlu dibersihkan...
📊 Total tickets: 15

🔧 Membersihkan ticket PD-202601:
   Sebelum: "Pengukuran Kualitas
Layanan Infrastruktur"
   Sesudah: "Pengukuran Kualitas Layanan Infrastruktur"

✅ Selesai!
   - Tickets yang diupdate: 3
   - Tickets yang tidak berubah: 12
```

### Catatan Keamanan

- Script ini aman dijalankan berkali-kali (idempotent)
- Tidak akan mengubah data yang sudah bersih
- Backup database disarankan sebelum menjalankan script di production
