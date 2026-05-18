const sampleCsv = `Kode_Transaksi;Nama_Obat
T001;Paracetamol
T001;Amoxilin
T002;Paracetamol
T002;Amoxilin
T002;Vitamin C
T003;Obat Batuk
T003;Vitamin C
T004;Paracetamol
T004;Obat Batuk
T005;Paracetamol
T005;Vitamin C
T005;Obat Flu
T006;Obat Flu
T006;Vitamin C
T007;Paracetamol
T007;Vitamin C
T007;Obat Batuk
T008;Paracetamol
T008;Obat Flu`;

const state = {
  source: "Sample CSV",
  transactions: [],
  itemsets: [],
  rules: [],
};

const els = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  usernameInput: document.querySelector("#usernameInput"),
  passwordInput: document.querySelector("#passwordInput"),
  loginMessage: document.querySelector("#loginMessage"),
  appShell: document.querySelector("#appShell"),
  overlay: document.querySelector("#analysisOverlay"),
  progressBar: document.querySelector("#analysisProgressBar"),
  progressText: document.querySelector("#analysisProgressText"),
  csvInput: document.querySelector("#csvInput"),
  templateButton: document.querySelector("#templateButton"),
  supportInput: document.querySelector("#supportInput"),
  confidenceInput: document.querySelector("#confidenceInput"),
  supportValue: document.querySelector("#supportValue"),
  confidenceValue: document.querySelector("#confidenceValue"),
  sampleButton: document.querySelector("#sampleButton"),
  previewButton: document.querySelector("#previewButton"),
  analyzeButton: document.querySelector("#analyzeButton"),
  jsonButton: document.querySelector("#jsonButton"),
  pdfButton: document.querySelector("#pdfButton"),
  logoutButton: document.querySelector("#logoutButton"),
  sheetUrlInput: document.querySelector("#sheetUrlInput"),
  saveSheetUrlButton: document.querySelector("#saveSheetUrlButton"),
  loadSheetButton: document.querySelector("#loadSheetButton"),
  saveSheetButton: document.querySelector("#saveSheetButton"),
  sheetStatus: document.querySelector("#sheetStatus"),
  addRowButton: document.querySelector("#addRowButton"),
  applyEditButton: document.querySelector("#applyEditButton"),
  transactionCount: document.querySelector("#transactionCount"),
  medicineCount: document.querySelector("#medicineCount"),
  itemsetCount: document.querySelector("#itemsetCount"),
  ruleCount: document.querySelector("#ruleCount"),
  dataStatus: document.querySelector("#dataStatus"),
  lastAnalyzed: document.querySelector("#lastAnalyzed"),
  aprioriStatus: document.querySelector("#aprioriStatus"),
  transactionRows: document.querySelector("#transactionRows"),
  itemsetRows: document.querySelector("#itemsetRows"),
  ruleRows: document.querySelector("#ruleRows"),
  topMedicines: document.querySelector("#topMedicines"),
  dataSource: document.querySelector("#dataSource"),
  medicineChart: document.querySelector("#medicineChart"),
  supportChart: document.querySelector("#supportChart"),
  clockDate: document.querySelector("#clockDate"),
  clockTime: document.querySelector("#clockTime"),
};

const loginConfig = { username: "admin", password: "admin123", key: "apriori_obat_logged_in" };
const sheetKey = "apotek_smf_sheet_url";

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if ((char === "," || char === ";") && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => normalizeHeader(h));
  const trxIndex = findIndex(headers, ["kode_transaksi", "transaction_id", "id_transaksi", "transaksi", "id"], 0);
  const medIndex = findIndex(headers, ["medicine", "nama_obat", "obat", "item"], 1);
  const itemsIndex = findIndex(headers, ["items", "daftar_obat"], -1);
  const grouped = new Map();

  rows.slice(1).forEach((cols, idx) => {
    const id = clean(cols[trxIndex]) || `T${String(idx + 1).padStart(3, "0")}`;
    const items = itemsIndex >= 0 ? splitItems(cols[itemsIndex]) : [clean(cols[medIndex])].filter(Boolean);
    if (!grouped.has(id)) grouped.set(id, new Set());
    items.forEach((item) => grouped.get(id).add(item));
  });

  return Array.from(grouped, ([id, set]) => ({ id, items: Array.from(set).sort() })).filter((t) => t.items.length);
}

function normalizeHeader(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function findIndex(headers, candidates, fallback) {
  const found = candidates.map((c) => headers.indexOf(c)).find((i) => i >= 0);
  return found >= 0 ? found : fallback;
}

function clean(value) {
  return String(value || "").trim();
}

function splitItems(value) {
  return clean(value).split(/[;,]/).map(clean).filter(Boolean);
}

function getAllItems(transactions = state.transactions) {
  return Array.from(new Set(transactions.flatMap((trx) => trx.items))).sort();
}

function combinations(items) {
  const result = [];
  for (let mask = 1; mask < 2 ** items.length; mask += 1) {
    const combo = [];
    items.forEach((item, index) => {
      if (mask & (1 << index)) combo.push(item);
    });
    result.push(combo);
  }
  return result;
}

function keyOf(items) {
  return [...items].sort().join("||");
}

function labelOf(items) {
  return [...items].sort().join(", ");
}

function runApriori(transactions, minSupport, minConfidence) {
  const total = transactions.length;
  const supports = new Map();
  const sets = transactions.map((trx) => new Set(trx.items));
  combinations(getAllItems(transactions)).forEach((combo) => {
    const count = sets.filter((set) => combo.every((item) => set.has(item))).length;
    const support = count / total;
    if (support >= minSupport) supports.set(keyOf(combo), { items: combo, support, count });
  });

  const itemsets = Array.from(supports.values()).sort((a, b) => b.support - a.support || labelOf(a.items).localeCompare(labelOf(b.items)));
  const rules = [];
  itemsets.filter((itemset) => itemset.items.length > 1).forEach((itemset) => {
    combinations(itemset.items).forEach((antecedent) => {
      if (antecedent.length === itemset.items.length) return;
      const consequent = itemset.items.filter((item) => !antecedent.includes(item));
      const aSupport = supports.get(keyOf(antecedent))?.support;
      const cSupport = supports.get(keyOf(consequent))?.support;
      if (!aSupport || !cSupport) return;
      const confidence = itemset.support / aSupport;
      if (confidence >= minConfidence) {
        rules.push({ antecedent, consequent, support: itemset.support, confidence, lift: confidence / cSupport });
      }
    });
  });
  rules.sort((a, b) => b.confidence - a.confidence || b.lift - a.lift);
  return { itemsets, rules };
}

function analyze({ syncEditor = true } = {}) {
  if (syncEditor) syncTransactionsFromEditor();
  if (!state.transactions.length) {
    state.itemsets = [];
    state.rules = [];
  } else {
    const result = runApriori(state.transactions, Number(els.supportInput.value), Number(els.confidenceInput.value));
    state.itemsets = result.itemsets;
    state.rules = result.rules;
  }
  els.lastAnalyzed.textContent = formatDateTime(new Date());
  render();
}

function runAnalysisWithSimulation(options = {}) {
  const messages = [
    "Membaca data transaksi obat...",
    "Mengelompokkan obat berdasarkan ID transaksi...",
    "Menghitung support kombinasi obat...",
    "Membentuk aturan asosiasi dan confidence...",
    "Menyiapkan grafik dan laporan...",
  ];
  let step = 0;
  els.overlay.classList.remove("hidden");
  els.progressBar.style.width = "0%";
  els.progressText.textContent = messages[0];
  const timer = setInterval(() => {
    step += 1;
    els.progressBar.style.width = `${Math.min((step / messages.length) * 100, 100)}%`;
    els.progressText.textContent = messages[Math.min(step, messages.length - 1)];
    if (step >= messages.length) {
      clearInterval(timer);
      setTimeout(() => {
        analyze(options);
        els.overlay.classList.add("hidden");
      }, 350);
    }
  }, 520);
}

function render() {
  const medicines = getAllItems();
  els.dataSource.textContent = state.source;
  els.dataStatus.textContent = `${state.transactions.length} transaksi dari ${state.source}`;
  els.transactionCount.textContent = state.transactions.length;
  els.medicineCount.textContent = medicines.length;
  els.itemsetCount.textContent = state.itemsets.length;
  els.ruleCount.textContent = state.rules.length;
  els.aprioriStatus.textContent = state.rules.length
    ? `${state.itemsets.length} itemset dan ${state.rules.length} rules ditemukan`
    : `${state.itemsets.length} itemset ditemukan, rules belum memenuhi confidence`;

  els.transactionRows.innerHTML = state.transactions.map((trx, index) => `
    <tr>
      <td><input class="edit-input transaction-id-input" value="${escapeHtml(trx.id)}" /></td>
      <td><input class="edit-input transaction-items-input" value="${escapeHtml(labelOf(trx.items))}" /></td>
      <td><button class="small-button delete-row" data-index="${index}" type="button">Hapus</button></td>
    </tr>`).join("");
  bindDeleteRows();

  els.itemsetRows.innerHTML = state.itemsets.length
    ? state.itemsets.map((item) => `<tr><td>${escapeHtml(labelOf(item.items))}</td><td>${fmt(item.support)}</td></tr>`).join("")
    : `<tr><td colspan="2" class="empty">Belum ada itemset pada batas support saat ini.</td></tr>`;

  els.ruleRows.innerHTML = state.rules.length
    ? state.rules.map((rule) => `<tr><td>${escapeHtml(labelOf(rule.antecedent))}</td><td>${escapeHtml(labelOf(rule.consequent))}</td><td>${fmt(rule.support)}</td><td>${fmt(rule.confidence)}</td><td>${fmt(rule.lift)}</td></tr>`).join("")
    : `<tr><td colspan="5" class="empty">Belum ada rules pada batas confidence saat ini.</td></tr>`;

  renderTopMedicines();
  renderCharts();
}

function bindDeleteRows() {
  document.querySelectorAll(".delete-row").forEach((button) => {
    button.addEventListener("click", () => {
      state.transactions.splice(Number(button.dataset.index), 1);
      analyze({ syncEditor: false });
    });
  });
}

function syncTransactionsFromEditor() {
  const rows = Array.from(els.transactionRows.querySelectorAll("tr"));
  const transactions = rows.map((row, index) => {
    const id = clean(row.querySelector(".transaction-id-input")?.value) || `T${String(index + 1).padStart(3, "0")}`;
    const items = splitItems(row.querySelector(".transaction-items-input")?.value || "");
    return { id, items: Array.from(new Set(items)).sort() };
  }).filter((trx) => trx.items.length);
  if (transactions.length) state.transactions = transactions;
}

function addEditableRow() {
  syncTransactionsFromEditor();
  state.transactions.push({ id: `T${String(state.transactions.length + 1).padStart(3, "0")}`, items: ["Nama Obat"] });
  render();
}

function getMedicineCounts() {
  const counts = new Map();
  state.transactions.forEach((trx) => trx.items.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1)));
  return Array.from(counts, ([item, count]) => ({ item, count })).sort((a, b) => b.count - a.count || a.item.localeCompare(b.item));
}

function renderTopMedicines() {
  const ranked = getMedicineCounts().slice(0, 5);
  const max = ranked[0]?.count || 1;
  els.topMedicines.innerHTML = ranked.map((entry) => `
    <div class="rank-item">
      <div class="rank-title"><span>${escapeHtml(entry.item)}</span><span>${entry.count}</span></div>
      <div class="bar"><span style="width:${(entry.count / max) * 100}%"></span></div>
    </div>`).join("");
}

function renderCharts() {
  const meds = getMedicineCounts().slice(0, 6);
  drawBarChart(els.medicineChart, meds.map((x) => x.item), meds.map((x) => x.count), "#f0b84f");
  const supports = state.itemsets.slice(0, 6);
  drawBarChart(els.supportChart, supports.map((x) => labelOf(x.items)), supports.map((x) => Number(fmt(x.support))), "#0f9f8f", 1);
}

function drawBarChart(canvas, labels, values, color, maxValue = Math.max(...values, 1)) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = 320 * ratio;
  ctx.scale(ratio, ratio);
  const width = rect.width;
  const height = 320;
  const pad = { top: 24, right: 20, bottom: 82, left: 46 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#dde4ee";
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + chartHeight);
  ctx.lineTo(pad.left + chartWidth, pad.top + chartHeight);
  ctx.stroke();
  if (!values.length) {
    ctx.fillStyle = "#647084";
    ctx.fillText("Belum ada data grafik.", pad.left, pad.top + 35);
    return;
  }
  const gap = 14;
  const barWidth = Math.max(24, (chartWidth - gap * (values.length - 1)) / values.length);
  values.forEach((value, i) => {
    const x = pad.left + i * (barWidth + gap);
    const h = (value / maxValue) * chartHeight;
    const y = pad.top + chartHeight - h;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, h);
    ctx.fillStyle = "#18212f";
    ctx.font = "700 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(value), x + barWidth / 2, y - 8);
    ctx.save();
    ctx.translate(x + barWidth / 2, pad.top + chartHeight + 15);
    ctx.rotate(-0.58);
    ctx.fillStyle = "#647084";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(shortLabel(labels[i]), 0, 0);
    ctx.restore();
  });
}

function loadSample() {
  state.source = "Sample CSV";
  state.transactions = parseCsv(sampleCsv);
  analyze({ syncEditor: false });
}

function previewComplete() {
  state.source = "Preview Data Contoh";
  state.transactions = parseCsv(sampleCsv);
  els.supportInput.value = "0.25";
  els.confidenceInput.value = "0.5";
  els.supportValue.textContent = "0.25";
  els.confidenceValue.textContent = "0.50";
  setSheetStatus("Preview berjalan dengan data contoh. Google Sheets bisa dikonekkan nanti.", "info");
  runAnalysisWithSimulation({ syncEditor: false });
}

function downloadTemplate() {
  const rows = [["Kode_Transaksi", "Nama_Obat"], ["T001", "Paracetamol"], ["T001", "Amoxilin"], ["T002", "Paracetamol"], ["T002", "Amoxilin"], ["T002", "Vitamin C"]];
  downloadBlob(toCsv(rows), "template_transaksi_apotek_smf_1_duku.csv", "text/csv;charset=utf-8");
}

function downloadJson() {
  syncTransactionsFromEditor();
  const payload = {
    source: state.source,
    min_support: Number(els.supportInput.value),
    min_confidence: Number(els.confidenceInput.value),
    transactions: state.transactions,
    frequent_itemsets: state.itemsets.map((x) => ({ itemsets: labelOf(x.items), support: Number(fmt(x.support)) })),
    association_rules: state.rules.map((x) => ({ antecedents: labelOf(x.antecedent), consequents: labelOf(x.consequent), support: Number(fmt(x.support)), confidence: Number(fmt(x.confidence)), lift: Number(fmt(x.lift)) })),
  };
  downloadBlob(JSON.stringify(payload, null, 2), "apriori_results.json", "application/json");
}

function savePdf() {
  syncTransactionsFromEditor();
  analyze({ syncEditor: false });
  window.print();
}

function saveSheetUrl() {
  const url = els.sheetUrlInput.value.trim();
  if (!url) return setSheetStatus("Tempel URL Web App Google Apps Script terlebih dahulu.", "error");
  localStorage.setItem(sheetKey, url);
  setSheetStatus("URL Google Sheets berhasil disimpan.", "success");
}

async function loadFromSheets() {
  const url = els.sheetUrlInput.value.trim();
  if (!url) return setSheetStatus("URL Google Sheets belum diisi.", "error");
  setSheetStatus("Mengambil data dari Google Sheets...", "info");
  try {
    const payload = await jsonpRequest(url);
    if (!payload.ok) throw new Error(payload.message || "Respons Google Sheets gagal.");
    const grouped = new Map();
    (payload.transactions || []).forEach((row, index) => {
      const id = clean(row.transaction_id || row.id || `T${String(index + 1).padStart(3, "0")}`);
      const med = clean(row.medicine || row.item || row.obat);
      if (!id || !med) return;
      if (!grouped.has(id)) grouped.set(id, new Set());
      grouped.get(id).add(med);
    });
    state.source = "Google Sheets";
    state.transactions = Array.from(grouped, ([id, set]) => ({ id, items: Array.from(set).sort() }));
    analyze({ syncEditor: false });
    setSheetStatus(`${state.transactions.length} transaksi berhasil dimuat dari Google Sheets.`, "success");
  } catch (error) {
    setSheetStatus(`Gagal memuat data: ${error.message}`, "error");
  }
}

async function saveToSheets() {
  const url = els.sheetUrlInput.value.trim();
  if (!url) return setSheetStatus("URL Google Sheets belum diisi.", "error");
  syncTransactionsFromEditor();
  setSheetStatus("Menyimpan data ke Google Sheets...", "info");
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ transactions: state.transactions, saved_at: new Date().toISOString() }),
    });
    setSheetStatus("Data dikirim ke Google Sheets. Klik Muat dari Sheets untuk mengecek.", "success");
  } catch (error) {
    setSheetStatus(`Gagal menyimpan data: ${error.message}`, "error");
  }
}

function jsonpRequest(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `sheetCallback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const separator = url.includes("?") ? "&" : "?";
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Koneksi Google Sheets timeout."));
    }, 15000);
    function cleanup() {
      clearTimeout(timeout);
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

function setSheetStatus(message, type = "info") {
  els.sheetStatus.textContent = message;
  els.sheetStatus.dataset.type = type;
}

function handleLogin(event) {
  event.preventDefault();
  if (els.usernameInput.value.trim() === loginConfig.username && els.passwordInput.value === loginConfig.password) {
    localStorage.setItem(loginConfig.key, "true");
    els.loginMessage.textContent = "";
    updateLoginView();
    return;
  }
  els.loginMessage.textContent = "Username atau password salah.";
}

function logout() {
  localStorage.removeItem(loginConfig.key);
  updateLoginView();
}

function updateLoginView() {
  const loggedIn = localStorage.getItem(loginConfig.key) === "true";
  els.loginScreen.classList.toggle("hidden", loggedIn);
  els.appShell.classList.toggle("locked", !loggedIn);
  if (!loggedIn) els.usernameInput.focus();
}

function updateClock() {
  const now = new Date();
  els.clockDate.textContent = now.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  els.clockTime.textContent = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutButton.addEventListener("click", logout);
  els.supportInput.addEventListener("input", () => (els.supportValue.textContent = fmt(Number(els.supportInput.value))));
  els.confidenceInput.addEventListener("input", () => (els.confidenceValue.textContent = fmt(Number(els.confidenceInput.value))));
  els.sampleButton.addEventListener("click", loadSample);
  els.previewButton.addEventListener("click", previewComplete);
  els.analyzeButton.addEventListener("click", () => runAnalysisWithSimulation());
  els.jsonButton.addEventListener("click", downloadJson);
  els.pdfButton.addEventListener("click", savePdf);
  els.templateButton.addEventListener("click", downloadTemplate);
  els.addRowButton.addEventListener("click", addEditableRow);
  els.applyEditButton.addEventListener("click", () => analyze());
  els.saveSheetUrlButton.addEventListener("click", saveSheetUrl);
  els.loadSheetButton.addEventListener("click", loadFromSheets);
  els.saveSheetButton.addEventListener("click", saveToSheets);
  els.csvInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    const transactions = parseCsv(await file.text());
    if (!transactions.length) return alert("CSV tidak terbaca. Gunakan kolom transaction_id dan medicine.");
    state.source = file.name;
    state.transactions = transactions;
    analyze({ syncEditor: false });
  });
  window.addEventListener("resize", renderCharts);
}

function init() {
  els.sheetUrlInput.value = localStorage.getItem(sheetKey) || "";
  if (els.sheetUrlInput.value) setSheetStatus("URL Google Sheets sudah tersimpan. Siap muat atau simpan data.", "success");
  bindEvents();
  updateLoginView();
  loadSample();
  startClock();
}

function fmt(value) {
  return Number(value || 0).toFixed(2);
}

function formatDateTime(date) {
  return `${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

function shortLabel(value) {
  const text = String(value);
  return text.length > 22 ? `${text.slice(0, 20)}...` : text;
}

function toCsv(rows) {
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\r\n");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

init();
