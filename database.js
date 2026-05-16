const databaseConfig = {
  storageKey: "apotek_smf_sheet_url",
};

const loginConfig = {
  username: "admin",
  password: "admin123",
  storageKey: "apotek_smf_database_logged_in",
};

const dbElements = {
  loginScreen: document.querySelector("#dbLoginScreen"),
  loginForm: document.querySelector("#dbLoginForm"),
  usernameInput: document.querySelector("#dbUsernameInput"),
  passwordInput: document.querySelector("#dbPasswordInput"),
  loginMessage: document.querySelector("#dbLoginMessage"),
  logoutButton: document.querySelector("#dbLogoutButton"),
  shell: document.querySelector(".database-shell"),
  sheetUrlInput: document.querySelector("#dbSheetUrlInput"),
  saveUrlButton: document.querySelector("#dbSaveUrlButton"),
  loadButton: document.querySelector("#dbLoadButton"),
  saveButton: document.querySelector("#dbSaveButton"),
  addRowButton: document.querySelector("#dbAddRowButton"),
  downloadCsvButton: document.querySelector("#dbDownloadCsvButton"),
  rows: document.querySelector("#dbRows"),
  status: document.querySelector("#dbStatus"),
  clockDate: document.querySelector("#dbClockDate"),
  clockTime: document.querySelector("#dbClockTime"),
};

let databaseRows = [
  { transaction_id: "T001", medicine: "Paracetamol" },
  { transaction_id: "T001", medicine: "Vitamin C" },
  { transaction_id: "T002", medicine: "Obat Batuk" },
];

function renderDatabaseRows() {
  dbElements.rows.innerHTML = databaseRows
    .map(
      (row, index) => `
        <tr>
          <td><input class="edit-input db-transaction-input" value="${escapeHtml(row.transaction_id)}" /></td>
          <td><input class="edit-input db-medicine-input" value="${escapeHtml(row.medicine)}" /></td>
          <td><button class="small-button delete-row db-delete-button" type="button" data-index="${index}">Hapus</button></td>
        </tr>
      `,
    )
    .join("");

  document.querySelectorAll(".db-delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      syncRowsFromTable();
      databaseRows.splice(Number(button.dataset.index), 1);
      renderDatabaseRows();
      setStatus("Baris berhasil dihapus. Klik Simpan Online untuk menyimpan ke Google Sheets.", "info");
    });
  });
}

function syncRowsFromTable() {
  databaseRows = Array.from(dbElements.rows.querySelectorAll("tr"))
    .map((row, index) => {
      const transactionId = row.querySelector(".db-transaction-input")?.value.trim() || `T${String(index + 1).padStart(3, "0")}`;
      const medicine = row.querySelector(".db-medicine-input")?.value.trim() || "";
      return { transaction_id: transactionId, medicine };
    })
    .filter((row) => row.transaction_id && row.medicine);
}

function addRow() {
  syncRowsFromTable();
  const nextNumber = databaseRows.length + 1;
  databaseRows.push({
    transaction_id: `T${String(nextNumber).padStart(3, "0")}`,
    medicine: "Nama Obat",
  });
  renderDatabaseRows();
  const inputs = document.querySelectorAll(".db-medicine-input");
  const lastInput = inputs[inputs.length - 1];
  if (lastInput) {
    lastInput.focus();
    lastInput.select();
  }
}

function getGroupedTransactions() {
  syncRowsFromTable();
  const grouped = new Map();
  databaseRows.forEach((row) => {
    if (!grouped.has(row.transaction_id)) {
      grouped.set(row.transaction_id, new Set());
    }
    grouped.get(row.transaction_id).add(row.medicine);
  });

  return Array.from(grouped, ([id, items]) => ({
    id,
    items: Array.from(items).sort(),
  }));
}

function parseSheetRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      transaction_id: String(row.transaction_id || row.id || "").trim(),
      medicine: String(row.medicine || row.item || "").trim(),
    }))
    .filter((row) => row.transaction_id && row.medicine);
}

function getSheetUrl() {
  return dbElements.sheetUrlInput.value.trim();
}

function saveSheetUrl() {
  const url = getSheetUrl();
  if (!url) {
    setStatus("Tempel URL Web App Google Apps Script terlebih dahulu.", "error");
    return;
  }
  localStorage.setItem(databaseConfig.storageKey, url);
  setStatus("URL Google Sheets berhasil disimpan.", "success");
}

async function loadFromSheets() {
  const url = getSheetUrl();
  if (!url) {
    setStatus("URL Google Sheets belum diisi.", "error");
    return;
  }

  setStatus("Mengambil data dari Google Sheets...", "info");
  try {
    const payload = await jsonpRequest(url);
    if (!payload.ok) {
      throw new Error(payload.message || "Respons Google Sheets gagal.");
    }
    databaseRows = parseSheetRows(payload.transactions);
    renderDatabaseRows();
    setStatus(`${databaseRows.length} baris berhasil dimuat dari Google Sheets.`, "success");
  } catch (error) {
    setStatus(`Gagal memuat data: ${error.message}`, "error");
  }
}

async function saveToSheets() {
  const url = getSheetUrl();
  if (!url) {
    setStatus("URL Google Sheets belum diisi.", "error");
    return;
  }

  const transactions = getGroupedTransactions();
  if (!transactions.length) {
    setStatus("Tidak ada data untuk disimpan.", "error");
    return;
  }

  setStatus("Menyimpan data ke Google Sheets...", "info");
  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        transactions,
        saved_at: new Date().toISOString(),
      }),
    });

    if (response.type === "opaque") {
      setStatus("Data dikirim ke Google Sheets. Klik Muat Data untuk mengecek.", "success");
      return;
    }

    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.message || "Respons Google Sheets gagal.");
    }
    setStatus("Data berhasil disimpan ke Google Sheets.", "success");
  } catch (error) {
    setStatus(`Gagal menyimpan data: ${error.message}`, "error");
  }
}

function downloadCsv() {
  syncRowsFromTable();
  const rows = [["transaction_id", "medicine"], ...databaseRows.map((row) => [row.transaction_id, row.medicine])];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "database_transaksi_apotek_smf_1_duku.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function jsonpRequest(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `dbSheetCallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const separator = url.includes("?") ? "&" : "?";
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Koneksi Google Sheets timeout."));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Gagal membaca URL Google Apps Script."));
    };

    script.src = `${url}${separator}callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

function setStatus(message, type = "info") {
  dbElements.status.textContent = message;
  dbElements.status.dataset.type = type;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  dbElements.clockDate.textContent = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  dbElements.clockTime.textContent = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function handleLogin(event) {
  event.preventDefault();
  const username = dbElements.usernameInput.value.trim();
  const password = dbElements.passwordInput.value;

  if (username === loginConfig.username && password === loginConfig.password) {
    localStorage.setItem(loginConfig.storageKey, "true");
    dbElements.loginMessage.textContent = "";
    updateLoginView();
    return;
  }

  dbElements.loginMessage.textContent = "Username atau password salah.";
}

function logout() {
  localStorage.removeItem(loginConfig.storageKey);
  dbElements.passwordInput.value = "";
  updateLoginView();
}

function updateLoginView() {
  const isLoggedIn = localStorage.getItem(loginConfig.storageKey) === "true";
  dbElements.loginScreen.classList.toggle("hidden", isLoggedIn);
  dbElements.shell.classList.toggle("locked", !isLoggedIn);
  if (!isLoggedIn) {
    dbElements.usernameInput.focus();
  }
}

dbElements.loginForm.addEventListener("submit", handleLogin);
dbElements.logoutButton.addEventListener("click", logout);
dbElements.saveUrlButton.addEventListener("click", saveSheetUrl);
dbElements.loadButton.addEventListener("click", loadFromSheets);
dbElements.saveButton.addEventListener("click", saveToSheets);
dbElements.addRowButton.addEventListener("click", addRow);
dbElements.downloadCsvButton.addEventListener("click", downloadCsv);

dbElements.sheetUrlInput.value = localStorage.getItem(databaseConfig.storageKey) || "";
if (dbElements.sheetUrlInput.value) {
  setStatus("URL Google Sheets sudah tersimpan. Siap muat atau simpan data.", "success");
}
renderDatabaseRows();
startClock();
updateLoginView();
