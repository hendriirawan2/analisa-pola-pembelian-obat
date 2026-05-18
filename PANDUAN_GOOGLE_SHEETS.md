# Panduan Koneksi Google Sheets

Ikuti langkah ini agar aplikasi GitHub Pages bisa menyimpan dan membaca data transaksi dari Google Sheets.

## 1. Buat Google Sheets

Buat spreadsheet baru di Google Sheets, misalnya:

```text
Database Apotek SMF 1 Duku
```

Buat sheet dengan nama:

```text
Transaksi
```

Isi header baris pertama:

```text
Kode_Transaksi | Nama_Obat
```

Contoh tabel yang benar:

| Kode_Transaksi | Nama_Obat |
|---|---|
| T001 | Paracetamol |
| T001 | Vitamin C |
| T001 | Obat Batuk |
| T002 | Paracetamol |
| T002 | Vitamin C |
| T003 | Obat Flu |

Artinya:

- Satu baris berisi satu obat.
- Jika satu transaksi membeli 3 obat, maka ID transaksi ditulis 3 kali.
- Nama kolom wajib paling aman adalah `Kode_Transaksi` dan `Nama_Obat`.

Nama kolom alternatif yang masih bisa dibaca:

```text
kode_transaksi, transaction_id, id_transaksi, transaksi, id
medicine, nama_obat, obat, item
```

## 2. Buka Apps Script

Di Google Sheets, klik:

```text
Extensions > Apps Script
```

Hapus kode bawaan, lalu copy isi file:

```text
google-apps-script.gs
```

Paste ke Apps Script.

## 3. Deploy Web App

Klik:

```text
Deploy > New deployment
```

Pilih:

```text
Web app
```

Atur:

```text
Execute as: Me
Who has access: Anyone
```

Klik:

```text
Deploy
```

Izinkan permission Google jika diminta.

## 4. Copy URL Web App

Setelah deploy, copy URL yang mirip seperti:

```text
https://script.google.com/macros/s/AKfycbxxxxx/exec
```

## 5. Tempel URL di Aplikasi

Buka aplikasi Analisa Pola Pembelian Obat.

Pada bagian `Google Sheets`, tempel URL Web App tadi, lalu klik:

```text
Simpan URL
```

Gunakan:

```text
Simpan ke Sheets
```

untuk menyimpan data transaksi dari aplikasi ke Google Sheets.

Gunakan:

```text
Muat dari Sheets
```

untuk mengambil data dari Google Sheets ke aplikasi.

## Catatan Penting

Jika mengubah kode Apps Script, deploy ulang:

```text
Deploy > Manage deployments > Edit > New version > Deploy
```
