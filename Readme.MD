# 🎙️ Voice Recording Application

Aplikasi web untuk recording audio voice dengan fitur form partisipan dan upload ke Supabase Storage.

## ✨ Features

- 📝 Form data partisipan dengan validasi
- 🎤 Recording audio langsung dari browser
- 📤 Upload file audio (mp3, wav, m4a, dll)
- 🔄 Auto convert ke format WAV
- ☁️ Upload otomatis ke Supabase Storage
- 📊 Progress tracking untuk multiple questions

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18 atau lebih baru)
- npm atau yarn
- Akun Supabase

### Local Development

1. Clone repository:
```bash
   git clone <repo-url>
   cd voice-recording-app
```

2. Install dependencies:
```bash
   npm install
```

3. Jalankan development server:
```bash
   npm start
```

4. Buka browser di `http://localhost:3000`

### Build Production
```bash
npm run build
```

## 📦 Deploy ke Netlify

### Option 1: Drag & Drop
1. Build project: `npm run build`
2. Drag folder `build` ke Netlify dashboard

### Option 2: GitHub Integration
1. Push code ke GitHub
2. Connect repository di Netlify
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Deploy!

## ⚙️ Supabase Configuration

### 1. Setup Database Table

Buat table `participants` dengan kolom:
```sql
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  program_study TEXT NOT NULL,
  city TEXT NOT NULL,
  age INTEGER NOT NULL,
  current_residence TEXT NOT NULL,
  campus TEXT NOT NULL,
  test_type TEXT NOT NULL,
  test_score INTEGER,
  perception TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Setup Storage Bucket

1. Go to Storage → Create bucket `audio`
2. Set as **Public bucket**
3. Add RLS Policy:
```sql
   -- Allow anonymous uploads
   CREATE POLICY "Allow anon insert"
   ON storage.objects FOR INSERT
   TO anon
   WITH CHECK (bucket_id = 'audio');

   -- Allow public read
   CREATE POLICY "Allow public read"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'audio');
```

### 3. Update Credentials (Optional)

Jika ingin menggunakan environment variables:
1. Buat file `.env` (jangan commit!)
2. Tambahkan: