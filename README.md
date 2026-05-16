# Analisa Pola Pembelian Obat

Aplikasi web/PWA untuk menganalisis pola pembelian obat menggunakan algoritma Apriori pada Apotek SMF 1 Duku.

## Login

```text
Username: admin
Password: admin123
```

## Cara Membuka Lokal

```powershell
cd "C:\Users\ACER\Documents\New project"
.\start_desktop_mode.bat
```

Lalu buka:

```text
http://127.0.0.1:4173/
```

## Install Mode Desktop

Aplikasi sudah disiapkan sebagai PWA. Setelah di-upload ke GitHub Pages, buka link aplikasi di Chrome/Edge lalu klik `Install App`.

File PWA:

```text
manifest.webmanifest
sw.js
pwa.js
PANDUAN_INSTALL_DESKTOP.md
```

## Fitur

- Login aplikasi
- Upload CSV transaksi obat
- Download template Excel/CSV
- Edit data transaksi langsung
- Simulasi proses Apriori dengan penjelasan
- Frequent itemsets
- Association rules
- Grafik obat terlaris
- Grafik support itemsets
- Simpan JSON
- Simpan PDF
- Koneksi Google Sheets
- Halaman database untuk embed Google Sites
- Install sebagai aplikasi desktop/PWA

## Format CSV

```csv
transaction_id,medicine
T001,Paracetamol
T001,Vitamin C
T001,Obat Batuk
T002,Paracetamol
T002,Vitamin C
```

Satu baris berisi satu obat. Jika satu transaksi membeli tiga obat, ID transaksi ditulis tiga kali.

## Google Sheets

Ikuti panduan:

```text
PANDUAN_GOOGLE_SHEETS.md
```

Gunakan halaman database:

```text
database.html
```
