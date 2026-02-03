# Cara Setup Port Forwarding dengan CORS

## Yang Sudah Dikonfigurasi

Backend sudah diupdate untuk mendukung port forwarding dengan konfigurasi CORS yang lebih fleksibel:

### Perubahan di `backend/src/index.ts`:
- CORS sekarang mengizinkan **semua origin** saat `NODE_ENV !== 'production'`
- Di production, CORS akan membatasi sesuai `ALLOWED_ORIGINS` di environment variables

## Langkah-langkah Setup

### 1. **Setup Backend**

Edit file `.env` di folder `backend/`:

```bash
NODE_ENV=development
PORT=5000
DATABASE_URL="your-database-url"
JWT_SECRET="your-secret-key"
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 2. **Setup Frontend (Jika Menggunakan Port Forwarding)**

Buat/edit file `.env.local` di folder `frontend/`:

```bash
# Ganti dengan URL port forwarding backend Anda
NEXT_PUBLIC_API_URL=https://your-backend-forwarded-url/api
```

**Contoh URL Port Forwarding:**
- GitHub Codespaces: `https://scaling-space-train-abc123.app.github.dev`
- VS Code Port Forward: `https://localhost-5000.preview.app.github.dev`
- Ngrok: `https://abc123.ngrok.io`

### 3. **Restart Kedua Server**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## Testing

1. Buka frontend di browser melalui URL port forwarding
2. Coba login atau akses API
3. Cek console browser (F12) untuk memastikan tidak ada CORS error
4. Cek terminal backend untuk melihat request masuk

## Troubleshooting

### Jika masih ada CORS error:

1. **Pastikan backend berjalan dalam mode development:**
   ```bash
   # Cek .env file
   NODE_ENV=development
   ```

2. **Tambahkan URL frontend Anda ke ALLOWED_ORIGINS:**
   ```bash
   ALLOWED_ORIGINS=https://your-frontend-url.app.github.dev,http://localhost:3000
   ```

3. **Restart backend setelah perubahan environment variables**

### Jika menggunakan Production:

Edit `.env` backend:
```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-backend-domain.com
```

## Tips

- Untuk development lokal: gunakan `NODE_ENV=development` (semua origin diizinkan)
- Untuk production: set `NODE_ENV=production` dan tambahkan domain yang diizinkan ke `ALLOWED_ORIGINS`
- Selalu restart server setelah mengubah file `.env`
