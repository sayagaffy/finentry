# FinEntry - Sistem Keuangan & Logistik Internal

**FinEntry** adalah aplikasi manajemen keuangan dan logistik internal yang dikembangkan untuk **Priventry**. Aplikasi ini dirancang untuk menangani operasional multi-perusahaan (multi-tenant) dengan fokus khusus pada distribusi gas LPG (kepatuhan pajak PMK 62) dan manajemen armada logistik.

---

## 1. Perkenalan Project

Aplikasi ini dibangun untuk memecahkan masalah pencatatan keuangan manual dan terfragmentasi. Fitur utamanya meliputi:
- **Multi-Company**: Satu akun "OWNER" bisa mengelola banyak PT/Perusahaan (Tenant) di dalam satu dashboard.
- **Kepatuhan PMK 62**: Logika otomatis untuk menghitung DPP (Dasar Pengenaan Pajak) khusus agen LPG subsidi.
- **Logistik Terintegrasi**: Pembuatan Surat Jalan (Delivery Order) yang langsung memotong stok dan mencatat piutang.
- **Laporan Real-time**: Laporan Laba Rugi (Income Statement) yang dihasilkan secara instan dari data transaksi.

---

## 2. Setup Project (Cara Instalasi)

Berikut langkah-langkah untuk menjalankan project ini di komputer lokal Anda:

### Prasyarat
- **Node.js** (Versi 18 atau terbaru)
- **PostgreSQL** Database (Bisa install lokal atau pakai cloud seperti Neon.tech)

### Langkah-langkah
1.  **Clone Repository**
    ```bash
    git clone <repository_url>
    cd fintrack
    ```

2.  **Setup Environment Variables**
    - Copy file `.env.example` ke `.env`.
    - Isi `DATABASE_URL` dengan koneksi database PostgreSQL Anda.
    - Isi `AUTH_SECRET` (bisa generate random string: `openssl rand -base64 32`).

3.  **Install Dependencies**
    ```bash
    npm install
    # atau jika ada error dependency conflict
    npm install --legacy-peer-deps
    ```

4.  **Setup Database (Schema & Seeding)**
    Langkah ini akan membuat tabel-tabel di database dan mengisi data awal (seperti user default).
    ```bash
    npx prisma db push
    npx prisma db seed
    ```

5.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 3. Arsitektur Solusi (Logic & Design)

Kami menggunakan **Next.js 15 (App Router)** dengan **Prisma ORM**. Berikut alasan dan logika di balik desain ini:

### A. Struktur Multi-Tenant
- **Data Terpisah**: Setiap data penting (Transaksi, Customer, Item) memiliki kolom `companyId`. Ini memastikan data antar PT tidak tercampur.
- **Peran User**:
    - `OWNER`: Super admin yang bisa melihat semua PT (Switch view).
    - `ADMIN`: Admin perusahaan yang hanya bisa melihat data PT-nya sendiri.

### B. Logika Transaksi "Atomic"
Kami **TIDAK** menghitung profit secara dinamis (on-the-fly) setiap kali laporan dibuka. Sebaliknya, kami menghitung dan **MENYIMPAN** angka final (Revenue, COGS, Margin) ke database saat transaksi dibuat.
*   **Kenapa?** Agar jika harga modal barang berubah di masa depan, profit transaksi lama **TIDAK** ikut berubah. Data historis harus akurat dan beku.

### C. Kepatuhan Pajak (PMK 62)
Untuk transaksi LPG, pajak tidak dihitung 11% dari total harga, melainkan dari mark-up margin agen. Logika ini tertanam di API (`app/api/transactions/route.ts`) untuk menghindari kesalahan hitung manusia.

### D. AI Integration
Kami menggunakan wrapper standar (`lib/aiHelper.ts`) yang bisa berganti provider (Gemini, Groq, OpenAI) dengan mudah melalui konfigurasi database, tanpa mengubah kode program.

---

## 4. Referensi Teknis (Developer Guide)

Bagian ini menjelaskan detail teknis yang perlu diketahui oleh pengembang.

### A. Struktur Folder (Foldering)
Struktur project mengikuti standar **Next.js App Router**:

```
fintrack/
├── app/                        # Pages & API Routes
│   ├── (dashboard)/            # Route Group (Dashboard Layout)
│   │   ├── admin/              # Super Admin Pages (Companies, Overview)
│   │   ├── master-data/        # CRUD Pages (Items, Customers, dll)
│   │   ├── transactions/       # Transaction Pages
│   │   └── reports/            # Financial Reports
│   ├── api/                    # Backend API Endpoints (JSON)
│   ├── login/                  # Auth Page
│   ├── layout.tsx              # Root Layout (Providers)
│   └── globals.css             # Global Tailwind Styles
├── components/                 # Reusable UI Components
│   ├── ui/                     # Shadcn/Radix Primitives (Button, Input)
│   ├── shared/                 # Business Components (PrintButton, ConfirmDialog)
│   ├── layout/                 # Sidebar, Navbar
│   └── ai/                     # AI Widgets
├── lib/                        # Utility & Core Logic
│   ├── prisma.ts               # Database Client (Singleton)
│   ├── apiClient.ts            # Fetch Wrapper (Standardized)
│   ├── aiHelper.ts             # AI Provider Logic
│   └── utils.ts                # Formatting Helpers (Currency, Date)
├── prisma/                     # Database Configuration
│   ├── schema.prisma           # DB Models Definition
│   └── seed.ts                 # Initial Data Script
└── types/                      # TypeScript Definitions
    └── next-auth.d.ts          # Auth Type Extensions
```

### B. Arsitektur Database (Schema & Relationships)
Database dirancang dengan model **Relational** (SQL). Berikut entitas utamanya:

*   **Company (Tenant Root)**: Entitas induk. Hampir semua tabel lain punya `companyId` (Foreign Key) ke sini.
*   **Transaction (Heart)**: Tabel pusat pencatatan.
    *   Relasi ke: `Customer`, `Vendor`, `Item`, `Vehicle`.
    *   Menyimpan snapshot finansial: `revenue`, `cogs`, `margin`, `taxType`.
*   **DeliveryOrder (Logistics)**:
    *   Mengelompokkan banyak `Transaction` (Invoice) ke dalam satu pengiriman.
    *   Relasi ke `Driver` dan `Vehicle`.
*   **Item (Inventory)**:
    *   Menyimpan stok `Full` vs `Empty` (penting untuk bisnis gas).
    *   Config pajak default (`defaultTaxType`).

### C. Relasi Antar Komponen (Client-Server Flow)
Aplikasi ini menggunakan pola **Hybrid** (Server & Client Components):

1.  **Frontend (Client Component)**:
    *   User mengisi Form (misal: `app/(dashboard)/transactions/page.tsx`).
    *   Component memanggil backend via `apiClient('/api/transactions')`.
    *   State dikelola lokal dengan `useState` (kecuali Auth via `useSession`).
2.  **Backend (Route Handler)**:
    *   API File (`app/api/transactions/route.ts`) menerima request.
    *   Melakukan validasi & perhitungan bisnis (Pajak, Margin).
    *   Menulis ke Database via `prisma.transaction.create`.
    *   Mengembalikan JSON response.
3.  **Authentication (Middleware)**:
    *   `middleware.ts` mencegat setiap request.
    *   Jika belum login -> Redirect ke `/login`.
    *   Jika login -> Cek Role & akses route.

### D. Autentikasi & Session
*   Menggunakan **NextAuth.js v5** (Beta).
*   Provider: `Credentials` (Email/Password).
*   Session User diperkaya dengan field kustom: `role`, `companyId`, `companyName` (lihat `types/next-auth.d.ts`).

---

## 5. Eskalasi & Troubleshooting

Jika terjadi masalah, ikuti panduan berikut sebelum eskalasi ke tim developer:

### A. Aplikasi Error / Blank (500 Error)
1.  Cek terminal tempat `npm run dev` berjalan. Biasanya error server akan muncul di sana.
2.  Jika error database, coba jalankan `npx prisma db push` untuk memastikan struktur database sinkron.

### B. Data Tidak Muncul
1.  Pastikan Anda login di perusahaan yang benar (jika Owner).
2.  Gunakan **Prisma Studio** untuk melihat data mentah di database:
    ```bash
    npx prisma studio
    ```

### C. Error Build saat Deploy
1.  Jalankan `npm run build` di lokal.
2.  Pastikan tidak ada error TypeScript atau ESLint.
3.  Pastikan semua komponen Client (`use client`) dan Server terpisah dengan benar (contoh: jangan pakai `useState` di file Server Component).

---

## 6. Metode Perubahan (Development Flow)

Untuk menjaga kualitas kode, ikuti standar ini saat melakukan perubahan:

1.  **Komentar Bahasa Indonesia**: Setiap fungsi atau logika kompleks **WAJIB** diberi komentar dalam Bahasa Indonesia yang menjelaskan "APA" dan "KENAPA" kode itu ada.
2.  **Update Task List**: Selalu update file `task.md` (jika menggunakan agen AI) atau issue tracker untuk melacak progres.
3.  **Verifikasi Build**: Sebelum commit/push, selalu jalankan `npm run build` untuk memastikan tidak ada error yang memblokir produksi.

---
*Dokumentasi ini dibuat untuk memudahkan pemeliharaan jangka panjang oleh tim internal Priventry.*
