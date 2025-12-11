# FinTrack - Product Requirements Document (MVP)

## Overview
FinTrack adalah aplikasi keuangan internal sederhana untuk menggantikan Excel manual dalam pencatatan transaksi harian dan menghasilkan Laporan Laba Rugi otomatis.

**Target User**: 3 perusahaan berbeda (instance & database terpisah)  
**Tech Stack**: Next.js Fullstack (App Router) + TypeScript + Prisma + PostgreSQL

---

## Core Features

### 1. Master Data Management
**Tujuan**: Menyimpan data referensi untuk transaksi

**Entities**:
- **Customer**: ID, nama, kontak, alamat (opsional)
- **Vendor/Transporter**: ID, nama, jenis (vendor/transporter), kontak
- **Item/Goods**: ID, nama, satuan (kg/ton/unit), kategori
- **Kendaraan** (opsional): ID, nomor plat, jenis, kapasitas
- **COA (Chart of Accounts)**: Akun dasar untuk Revenue, COGS, Transport Cost, Other Expenses

**Fitur**:
- CRUD sederhana untuk setiap entity
- Pencarian dan filter
- Validasi duplikasi nama

---

### 2. Transaction Module
**Tujuan**: Input dan manage transaksi harian, perhitungan otomatis margin

**Form Input**:
| Field | Type | Required | Calculation |
|-------|------|----------|-------------|
| Tanggal | Date | ✅ | - |
| Jenis Transaksi | Select (Penjualan/Pembelian) | ✅ | - |
| Customer/Vendor | Select | ✅ | - |
| Item | Select | ✅ | - |
| Volume | Number | ✅ | - |
| Harga Dasar (per unit) | Number | ✅ | Base * Volume = COGS |
| Harga Jual (per unit) | Number | ✅ | Sell * Volume = Revenue |
| Biaya Transport | Number | ❌ | → Expense |
| Biaya Tak Terduga | Number | ❌ | → Expense |
| Biaya Lainnya | Number | ❌ | → Expense |
| **Total Margin** | Auto | - | Revenue - COGS - All Expenses |

**Transaction List**:
- Table view dengan kolom: Tanggal, ID Transaksi, Jenis, Customer/Vendor, Item, Volume, Revenue, Total Biaya, Margin
- Filter: Tanggal (range), Jenis, Customer, Item
- Search: ID Transaksi, Customer name
- Sort: Tanggal, Margin
- Action: Edit, Delete, View Detail

**Business Logic**:
```
Revenue = Harga Jual × Volume
COGS = Harga Dasar × Volume
Total Expenses = Biaya Transport + Biaya Tak Terduga + Biaya Lainnya
Margin = Revenue - COGS - Total Expenses
Margin % = (Margin / Revenue) × 100
```

---

### 3. Profit & Loss Report
**Tujuan**: Laporan Laba Rugi otomatis per periode dengan drill-down ke transaksi

**Filter Periode**:
- Harian (pilih tanggal spesifik)
- Bulanan (pilih bulan & tahun)
- Custom range (tanggal mulai - tanggal akhir)

**Struktur Laporan**:
```
=====================================
LAPORAN LABA RUGI
Periode: [01 Nov 2023 - 30 Nov 2023]
=====================================

PENDAPATAN
Penjualan                    Rp 50,000,000
                             -------------- 
TOTAL PENDAPATAN             Rp 50,000,000

BEBAN POKOK PENJUALAN (COGS)
Harga Pokok Barang           Rp 30,000,000
                             --------------
TOTAL COGS                   Rp 30,000,000

LABA KOTOR                   Rp 20,000,000
Margin (%)                   40.0%

BIAYA OPERASIONAL
Biaya Transport              Rp  3,500,000
Biaya Tak Terduga            Rp    800,000
Biaya Lainnya                Rp    200,000
                             --------------
TOTAL BIAYA                  Rp  4,500,000

=====================================
LABA BERSIH                  Rp 15,500,000
Margin Bersih (%)            31.0%
=====================================

Jumlah Transaksi: 47
```

**Interaksi**:
- Klik pada nilai → tampilkan daftar transaksi penyusun angka tersebut
- Contoh: Klik "Biaya Transport Rp 3,500,000" → tampilkan 47 transaksi dengan detail biaya transport

**Export**:
- Excel (.xlsx): Format tabel rapi dengan formula
- PDF: Format siap cetak dengan header perusahaan

---

### 4. AI Finance Assistant
**Tujuan**: Menjawab pertanyaan keuangan standar dengan bahasa natural

**UI**:
- Halaman "Ask Your Finance Assistant"
- Chat interface sederhana (tidak perlu histori persist)
- 3 tombol pertanyaan preset:
  1. "Berapa laba bulan ini?"
  2. "Berapa total biaya transport bulan ini?"
  3. "Siapa 3 customer terbesar bulan ini?"

**Input**:
- Pertanyaan bebas user
- Otomatis detect periode (default: bulan ini)
- Contoh: "Berapa laba minggu lalu?", "Customer terbesar Q4 2023?"

**Processing**:
1. Parse user query → extract:
   - Intent (laba/biaya/customer/vendor/item)
   - Periode (bulan ini/minggu lalu/custom)
   - Filter tambahan (jika ada)

2. Query database sesuai intent

3. Format jawaban dengan LLM (BYO AI provider)

**Output**:
```
💬 Pertanyaan: "Berapa laba bulan ini?"

📊 Jawaban:
Laba bersih bulan November 2023 adalah Rp 15,500,000 
dengan margin 31.0% dari total pendapatan Rp 50,000,000.

Detail:
- Total Pendapatan: Rp 50,000,000
- COGS: Rp 30,000,000
- Biaya Operasional: Rp 4,500,000
- Jumlah Transaksi: 47

[Lihat Detail Laporan]
```

**LLM Integration**:
- API endpoint: `/api/ai-assistant`
- Input: `{ query: string, context?: { startDate, endDate } }`
- LLM provider: Configurable (OpenAI/Anthropic/BYO AI via env var)
- Prompt template:
  ```
  Kamu adalah asisten keuangan. Berdasarkan data berikut:
  {data_finansial}
  
  Jawab pertanyaan user dengan singkat dan jelas:
  {user_question}
  ```

---

## Technical Requirements

### Database (PostgreSQL + Prisma)
- Multi-tenant melalui instance terpisah (bukan schema separation)
- Soft delete untuk transaction (keep audit trail)
- Index pada: tanggal transaksi, customer_id, item_id

### API Routes (Next.js)
```
/api/customers          [GET, POST, PUT, DELETE]
/api/vendors            [GET, POST, PUT, DELETE]
/api/items              [GET, POST, PUT, DELETE]
/api/vehicles           [GET, POST, PUT, DELETE] (optional)
/api/coa                [GET, POST, PUT, DELETE]

/api/transactions       [GET, POST, PUT, DELETE]
/api/transactions/stats [GET] → aggregate data

/api/reports/pl         [GET] → Profit & Loss by period
/api/reports/export     [POST] → Excel/PDF generation

/api/ai-assistant       [POST] → process query + call LLM
```

### UI/UX
- **Layout**: Sidebar kiri (nav menu) + konten kanan
- **Design system**: Referensi mockup Visily (B2B SaaS style)
- **Responsive**: Desktop-first, tablet support
- **Color scheme**: Professional blue/gray palette
- **Components**: shadcn/ui atau Headless UI

### Security
- Environment variables untuk:
  - `DATABASE_URL`
  - `LLM_API_KEY`
  - `LLM_PROVIDER` (openai/anthropic/custom)
- API key tidak exposed ke client
- Input validation & sanitization

---

## Out of Scope (MVP)
❌ Konsolidasi data antar perusahaan  
❌ User management & role-based access (asumsi: 1 user per instance untuk MVP)  
❌ Budgeting & forecasting  
❌ Advanced analytics (trend, comparison YoY)  
❌ Mobile app  
❌ Real-time collaboration  
❌ Inventory management  
❌ Multi-currency  

---

## Success Criteria
✅ User bisa input 10 transaksi dalam 5 menit (lebih cepat dari Excel)  
✅ Laporan Laba Rugi otomatis generate dalam < 2 detik  
✅ Export PDF/Excel berfungsi tanpa error  
✅ AI Assistant menjawab pertanyaan preset dengan akurat  
✅ Mudah di-clone untuk instance baru (< 30 menit setup)  

---

## Timeline Estimate (Solo Developer)
- **Week 1**: Setup project, database schema, master data CRUD
- **Week 2**: Transaction module (form + list + calculation)
- **Week 3**: Profit & Loss report + export
- **Week 4**: AI Assistant + polish UI + deployment

**Total**: ~4 minggu untuk MVP fungsional
