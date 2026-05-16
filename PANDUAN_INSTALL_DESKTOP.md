# Panduan Install Mode Desktop

Aplikasi Analisa Pola Pembelian Obat sudah disiapkan sebagai PWA atau Progressive Web App.

Artinya, setelah aplikasi di-upload ke GitHub Pages, aplikasi bisa di-install di laptop/PC seperti aplikasi desktop.

## Syarat

Aplikasi harus dibuka dari alamat HTTPS, misalnya:

```text
https://USERNAME.github.io/NAMA-REPOSITORY/
```

Jika dibuka langsung dari file `index.html`, tombol install biasanya belum aktif karena browser membutuhkan HTTPS atau localhost.

Untuk mencoba lewat localhost di PC sendiri, jalankan:

```powershell
.\start_desktop_mode.bat
```

Lalu buka:

```text
http://127.0.0.1:4173/
```

## Cara Install di Google Chrome

1. Buka link GitHub Pages aplikasi.
2. Login ke aplikasi.
3. Tunggu tombol `Install App` muncul di bagian atas.
4. Klik `Install App`.
5. Pilih `Install`.

Jika tombol belum muncul:

1. Klik ikon titik tiga Chrome.
2. Pilih `Save and share`.
3. Klik `Install page as app`.
4. Klik `Install`.

## Cara Install di Microsoft Edge

1. Buka link GitHub Pages aplikasi.
2. Klik ikon titik tiga.
3. Pilih `Apps`.
4. Klik `Install this site as an app`.
5. Klik `Install`.

## File PWA yang Sudah Ditambahkan

```text
manifest.webmanifest
sw.js
assets/logo-smf.svg
```

## Catatan

Mode desktop tetap menggunakan data dari browser dan layanan online yang dikoneksikan, misalnya Google Sheets.
