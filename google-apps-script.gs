const SHEET_NAME = "Transaksi";

function doGet(event) {
  const sheet = getOrCreateSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map((header) => normalizeHeader(header));
  const transactionIndex = findHeaderIndex(headers, ["kode_transaksi", "transaction_id", "id_transaksi", "transaksi", "id"], 0);
  const medicineIndex = findHeaderIndex(headers, ["medicine", "nama_obat", "obat", "item"], 1);
  const dataRows = rows.slice(1);
  const transactions = dataRows
    .filter((row) => row[transactionIndex] && row[medicineIndex])
    .map((row) => ({
      transaction_id: String(row[transactionIndex]),
      medicine: String(row[medicineIndex]),
    }));

  return jsonResponse({
    ok: true,
    transactions,
  }, event);
}

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || "{}");
  const transactions = payload.transactions || [];
  const sheet = getOrCreateSheet();

  sheet.clearContents();
  sheet.appendRow(["Kode_Transaksi", "Nama_Obat"]);

  transactions.forEach((transaction) => {
    const transactionId = transaction.id || transaction.transaction_id;
    const items = transaction.items || [];
    items.forEach((medicine) => {
      sheet.appendRow([transactionId, medicine]);
    });
  });

  return jsonResponse({
    ok: true,
    saved_rows: transactions.reduce((total, transaction) => {
      return total + (transaction.items || []).length;
    }, 0),
  });
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Kode_Transaksi", "Nama_Obat"]);
  }

  return sheet;
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function findHeaderIndex(headers, candidates, defaultIndex) {
  const index = candidates
    .map((candidate) => headers.indexOf(candidate))
    .find((candidateIndex) => candidateIndex >= 0);
  return index >= 0 ? index : defaultIndex;
}

function jsonResponse(payload, event) {
  const callback = event && event.parameter && event.parameter.callback;
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(payload)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
