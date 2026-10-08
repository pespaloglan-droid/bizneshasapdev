// ── Uygulama Durumu ──────────────────────────────────────────────────────
let currentScreen = 'lock'; // 'lock' | 'platform' | 'keygen'
let selectedPlatform = null; // 'pc' | 'apk'
let selectedDays = null;
let failedAttempts = 0;
let lockoutUntil = 0;

// ── Ekran Geçişleri ──────────────────────────────────────────────────────
function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${screenName}`).classList.add('active');
  currentScreen = screenName;
}

// ── Ekran 1: Kilit ──────────────────────────────────────────────────────
const passwordInput = document.getElementById('password-input');
const unlockBtn = document.getElementById('unlock-btn');
const errorMsg = document.getElementById('error-msg');

// Enter tuşu ile unlock
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    unlockBtn.click();
  }
});

unlockBtn.addEventListener('click', async () => {
  const now = Date.now();
  
  // Lockout kontrolü
  if (lockoutUntil > now) {
    const remainingSecs = Math.ceil((lockoutUntil - now) / 1000);
    showError(`Çok fazla hatalı deneme. ${remainingSecs} saniye bekleyin.`);
    return;
  }
  
  const password = passwordInput.value.trim();
  
  if (!password) {
    showError('Parola boş olamaz');
    return;
  }
  
  // Loading durumu
  unlockBtn.textContent = 'Kontrol ediliyor...';
  unlockBtn.disabled = true;
  
  try {
    const success = await window.adminApi.unlock(password);
    
    if (success) {
      // Başarılı - platform seçimine geç
      errorMsg.classList.add('hidden');
      failedAttempts = 0;
      showScreen('platform');
    } else {
      // Başarısız
      failedAttempts++;
      
      if (failedAttempts >= 3) {
        // 3. hatalı denemeden sonra 30 saniye lockout
        lockoutUntil = now + 30000;
        showError('Çok fazla hatalı deneme. 30 saniye bekleyin.');
      } else {
        showError(`Yanlış parola (${failedAttempts}/3)`);
      }
      
      passwordInput.value = '';
      passwordInput.focus();
    }
  } catch (err) {
    showError('Bir hata oluştu: ' + err.message);
  } finally {
    unlockBtn.textContent = 'Kilidi Aç';
    unlockBtn.disabled = false;
  }
});

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
}

// Sayfa yüklendiğinde password input'a focus
window.addEventListener('DOMContentLoaded', () => {
  passwordInput.focus();
});

// ── Ekran 2: Platform Seçimi ──────────────────────────────────────────────
const btnPc = document.getElementById('btn-pc');
const btnApk = document.getElementById('btn-apk');

btnPc.addEventListener('click', () => {
  selectedPlatform = 'pc';
  showScreen('keygen');
  updatePlatformBadge();
  document.getElementById('tabs-bar').classList.remove('hidden');
  requestCodeInput.focus();
});

btnApk.addEventListener('click', () => {
  selectedPlatform = 'apk';
  showScreen('keygen');
  updatePlatformBadge();
  document.getElementById('tabs-bar').classList.remove('hidden');
  requestCodeInput.focus();
});

function updatePlatformBadge() {
  const badge = document.getElementById('platform-badge');
  badge.textContent = selectedPlatform === 'pc' ? 'PC' : 'APK';
}

// ── Ekran 3: Key Oluşturma ─────────────────────────────────────────────────
const requestCodeInput = document.getElementById('request-code');
const requestInfo = document.getElementById('request-info');
const customDaysInput = document.getElementById('custom-days');
const createKeyBtn = document.getElementById('create-key-btn');
const resultPanel = document.getElementById('result-panel');
const noteInput = document.getElementById('note-input');

// İstek kodu canlı doğrulama
let decodeTimeout = null;
requestCodeInput.addEventListener('input', () => {
  clearTimeout(decodeTimeout);
  
  const code = requestCodeInput.value.trim();
  
  if (!code) {
    requestInfo.classList.add('hidden');
    updateCreateButton();
    return;
  }
  
  // 500ms debounce
  decodeTimeout = setTimeout(async () => {
    const result = await window.adminApi.decodeRequest(code);
    
    if (result.valid) {
      requestInfo.classList.remove('hidden', 'error');
      requestInfo.innerHTML = `
        ✅ <strong>Geçerli</strong><br>
        Hesap ID: <code>${result.accountIdFormatted}</code><br>
        Cihaz: <code>${result.deviceAnchor}</code>
      `;
    } else {
      requestInfo.classList.remove('hidden');
      requestInfo.classList.add('error');
      requestInfo.innerHTML = `❌ Geçersiz kod - 24 karakter olmalı`;
    }
    
    updateCreateButton();
  }, 500);
});

// Süre butonları
const durationButtons = document.querySelectorAll('.btn-duration');
durationButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Diğerlerinin seçimini kaldır
    durationButtons.forEach(b => b.classList.remove('selected'));
    
    // Bu butonu seç
    btn.classList.add('selected');
    selectedDays = parseInt(btn.dataset.days);
    
    // Özel günü temizle
    customDaysInput.value = '';
    
    updateCreateButton();
  });
});

// Özel gün girişi
customDaysInput.addEventListener('input', () => {
  const days = parseInt(customDaysInput.value);
  
  if (days >= 1 && days <= 730) {
    // Hazır butonların seçimini kaldır
    durationButtons.forEach(b => b.classList.remove('selected'));
    selectedDays = days;
  } else {
    selectedDays = null;
  }
  
  updateCreateButton();
});

function updateCreateButton() {
  const code = requestCodeInput.value.trim();
  const hasValidCode = code.length === 24; // Basit kontrol
  const hasDays = selectedDays !== null && selectedDays > 0;
  
  createKeyBtn.disabled = !(hasValidCode && hasDays);
}

// KEY OLUŞTUR
createKeyBtn.addEventListener('click', async () => {
  const code = requestCodeInput.value.trim();
  
  if (!code || !selectedDays) {
    return;
  }
  
  // Loading durumu
  createKeyBtn.textContent = 'Oluşturuluyor...';
  createKeyBtn.disabled = true;
  
  try {
    const result = await window.adminApi.createKey({
      requestCode: code,
      days: selectedDays,
      platform: selectedPlatform,
      features: 0x3F, // Tüm özellikler
      maxRegisters: 0, // Sınırsız
      activateByDays: 14,
      extend: true,
      note: noteInput.value.trim() || `${selectedPlatform.toUpperCase()} - ${selectedDays} gün`
    });
    
    if (result.error) {
      alert('Hata: ' + result.error);
      return;
    }
    
    // Sonucu göster
    showResult(result);
    
  } catch (err) {
    alert('Bir hata oluştu: ' + err.message);
  } finally {
    createKeyBtn.textContent = 'KEY OLUŞTUR';
    createKeyBtn.disabled = false;
  }
});

function showResult(result) {
  let html = '';

  // Kök kod: yalnızca hesabın İLK key'inde üretilir (sonraki key'lerde null gelir).
  if (result.rootCode) {
    html += `
      <div class="result-card root">
        <h3>🔑 KÖK KOD (Müşteriye ÖNCE bunu gönderin)</h3>
        <div class="code-box">
          <code id="root-code-display">${formatCode(result.rootCode)}</code>
        </div>
        <button class="btn btn-copy" onclick="copyToClipboard('root-code-display', this)">
          📋 Kopyala
        </button>
        <p class="root-note">
          Bu kök kod <strong>sadece bir kez</strong> verilir — hesabın ilk aktivasyonu
          için kullanılır. Sonraki yenilemelerde gerekmez. Kaybettirseniz aşağıdaki
          <strong>“Kök Kod Üret”</strong> aracıyla hesap ID’den yeniden üretebilirsiniz.
        </p>
      </div>
    `;
  } else {
    html += `
      <div class="root-note">
        ℹ️ Bu hesap için kök kod <strong>daha önce verilmiş</strong> (ilk key ile birlikte).
        Müşteri ilk kurulumda girdiyse kök kod <strong>gerekmez</strong> — sadece anahtarı
        yeni cihaza yazması yeterli. Kaybolduysa formun altındaki
        <strong>“Kök Kod Üret”</strong> aracını kullanın.
      </div>
    `;
  }
  
  // Lisans anahtarı
  html += `
    <div class="result-card key">
      <h3>✨ LİSANS ANAHTARI</h3>
      <div class="code-box">
        <code id="license-key-display">${formatCode(result.key)}</code>
      </div>
      <button class="btn btn-copy" onclick="copyToClipboard('license-key-display', this)">
        📋 Kopyala
      </button>
    </div>
    
    <div class="result-info">
      ✅ Key #${result.seq} üretildi ve kaydedildi<br>
      Platform: <strong>${selectedPlatform.toUpperCase()}</strong> | 
      Süre: <strong>${selectedDays} gün</strong>
    </div>
    
    <button class="btn btn-secondary" onclick="resetForm()">
      ➕ Yeni Key Oluştur
    </button>
  `;
  
  resultPanel.innerHTML = html;
  resultPanel.classList.remove('hidden');
  
  // Formu devre dışı bırak
  requestCodeInput.disabled = true;
  customDaysInput.disabled = true;
  durationButtons.forEach(b => b.disabled = true);
  createKeyBtn.disabled = true;
}

// Kodu 6'lı gruplara böl
function formatCode(code) {
  return code.match(/.{1,6}/g).join(' ');
}

// Panoya kopyala
window.copyToClipboard = function(elementId, button) {
  const element = document.getElementById(elementId);
  const text = element.textContent.replace(/\s/g, ''); // Boşlukları kaldır
  
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = '✅ Kopyalandı!';
    button.style.background = '#48bb78';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }).catch(err => {
    alert('Kopyalama başarısız: ' + err.message);
  });
};

// Formu sıfırla
window.resetForm = function() {
  requestCodeInput.value = '';
  requestCodeInput.disabled = false;
  noteInput.value = '';
  noteInput.disabled = false;
  customDaysInput.value = '';
  customDaysInput.disabled = false;
  requestInfo.classList.add('hidden');
  resultPanel.classList.add('hidden');
  selectedDays = null;
  
  durationButtons.forEach(b => {
    b.classList.remove('selected');
    b.disabled = false;
  });
  
  updateCreateButton();
  requestCodeInput.focus();
};

// ── Üst Sekmeler ────────────────────────────────────────────────────────
const tabsBar = document.getElementById('tabs-bar');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    tabContents.forEach(c => c.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');
    
    if (targetTab === 'records-tab') {
      loadRecords();
    }
  });
});

// ── Kök Kod Üret (hesap ID'den deterministik yeniden üretim) ─────────────
const rootCodeAccount = document.getElementById('root-code-account');
const genRootBtn = document.getElementById('gen-root-btn');
const rootCodeResult = document.getElementById('root-code-result');

genRootBtn.addEventListener('click', async () => {
  const accountId = rootCodeAccount.value.trim().toUpperCase();

  if (!accountId) {
    alert('Hesap ID girin (örn. XXXX-XXXX-XXXX-XX)');
    return;
  }

  genRootBtn.textContent = 'Üretiliyor...';
  genRootBtn.disabled = true;

  try {
    const res = await window.adminApi.generateRootCode(accountId);

    if (res.error) {
      alert('Hata: ' + res.error);
      return;
    }

    document.getElementById('root-code-display-2').textContent = formatCode(res.rootCode);
    rootCodeResult.classList.remove('hidden');
  } catch (err) {
    alert('Hata: ' + (err.message || err));
  } finally {
    genRootBtn.textContent = 'KÖK KOD ÜRET';
    genRootBtn.disabled = false;
  }
});

// Modal dışındaki kod kutularından kopyalama (kök kod aracı için)
window.copyRawFromModal = function(elementId, button) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const text = element.textContent.replace(/\s/g, '');

  navigator.clipboard.writeText(text).then(() => {
    const orig = button.textContent;
    button.textContent = '✅ Kopyalandı!';
    setTimeout(() => { button.textContent = orig; }, 2000);
  }).catch(err => alert('Kopyalama hatası: ' + err.message));
};

// ── Kayıtlar ────────────────────────────────────────────────────────────
let allRecords = [];

const recordsBody = document.getElementById('records-body');
const recordsSearch = document.getElementById('records-search');
const recordsStats = document.getElementById('records-stats');
const recordsEmpty = document.getElementById('records-empty');

async function loadRecords() {
  recordsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Yükleniyor...</td></tr>';
  
  try {
    allRecords = await window.adminApi.listKeys({});
    renderRecords();
  } catch (err) {
    recordsBody.innerHTML = `<tr><td colspan="7" class="empty-row">Hata: ${err.message}</td></tr>`;
  }
}

function filterRecords(query) {
  if (!query) return allRecords;
  
  const q = query.toLowerCase();
  return allRecords.filter(r => {
    return (
      (r.note || '').toLowerCase().includes(q) ||
      (r.accountIdFormatted || '').toLowerCase().includes(q) ||
      (r.platform || '').toLowerCase().includes(q) ||
      (r.plan || '').toLowerCase().includes(q) ||
      String(r.seq) === q
    );
  });
}

function renderRecords() {
  const query = recordsSearch.value.trim();
  const filtered = filterRecords(query);
  
  // İstatistik
  const totalCount = allRecords.length;
  const uniqueAccounts = new Set(allRecords.map(r => r.accountIdFormatted)).size;
  const totalDays = allRecords.reduce((sum, r) => sum + (r.days || 0), 0);
  
  if (totalCount === 0) {
    recordsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Henüz key üretilmemiş</td></tr>';
    recordsStats.innerHTML = 'Toplam: <strong>0</strong> kayıt';
    return;
  }
  
  recordsStats.innerHTML = `
    Toplam: <strong>${totalCount}</strong> kayıt • 
    Hesap: <strong>${uniqueAccounts}</strong> • 
    Toplam süre: <strong>${totalDays}</strong> gün
    ${query ? `<br>Filtre: <strong>${filtered.length}</strong> sonuç` : ''}
  `;
  
  if (filtered.length === 0) {
    recordsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Aramanızla eşleşen kayıt yok</td></tr>';
    return;
  }
  
  // En yeni en üstte
  const sorted = [...filtered].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  
  recordsBody.innerHTML = sorted.map((r, idx) => {
    const date = new Date(r.issuedAt);
    const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + 
                    ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const platform = (r.platform === 'apk') ? 'apk' : 'pc';
    const noteText = r.note ? escapeHtml(r.note) : '<span class="note-empty">—</span>';
    
    return `<tr>
      <td class="cell-date">${dateStr}</td>
      <td class="cell-note" title="${escapeHtml(r.note || '')}">${noteText}</td>
      <td class="cell-account">${r.accountIdFormatted || '—'}</td>
      <td><span class="platform-badge ${platform}">${platform.toUpperCase()}</span></td>
      <td class="cell-days">${r.days || '?'} gün</td>
      <td class="cell-seq">${r.seq}</td>
      <td>
        <button class="btn-view-key" data-idx="${idx}">Görüntüle</button>
        <button class="btn-copy-small" data-copy-idx="${idx}" title="Anahtarı kopyala">📋</button>
      </td>
    </tr>`;
  }).join('');
  
  // Buton event'leri
  recordsBody.querySelectorAll('.btn-view-key').forEach(btn => {
    btn.addEventListener('click', () => {
      showKeyDetail(sorted[parseInt(btn.dataset.idx)]);
    });
  });
  
  recordsBody.querySelectorAll('[data-copy-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const record = sorted[parseInt(btn.dataset.copyIdx)];
      copyRaw(record.key, btn);
    });
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Arama
recordsSearch.addEventListener('input', () => renderRecords());

// Yenile
document.getElementById('refresh-records').addEventListener('click', () => loadRecords());

// Tüm kayıtları temizle
document.getElementById('clear-records').addEventListener('click', async () => {
  if (allRecords.length === 0) {
    alert('Zaten kayıt yok.');
    return;
  }

  const confirmed = confirm(
    `Tüm ${allRecords.length} key kaydı silinecek.\n\n` +
    `DİKKAT: Bu işlem geri alınamaz!\n` +
    `Üretilmiş anahtarların KAYDI kaybolur (üretilen anahtarların kendisi etkilenmez).\n\n` +
    `Devam edilsin mi?`
  );

  if (!confirmed) return;

  const result = await window.adminApi.clearKeys();

  if (result.error) {
    alert('Silinemedi: ' + result.error);
    return;
  }

  recordsSearch.value = '';
  await loadRecords();
});

// Ham metni kopyala (boşluksuz)
function copyRaw(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = button.textContent;
    button.textContent = '✅';
    setTimeout(() => { button.textContent = orig; }, 1500);
  }).catch(err => alert('Kopyalama hatası: ' + err.message));
}

// Key detay modalı
function showKeyDetail(record) {
  const existing = document.getElementById('key-modal');
  if (existing) existing.remove();
  
  const platform = (record.platform === 'apk') ? 'apk' : 'pc';
  const date = new Date(record.issuedAt).toLocaleString('tr-TR');
  
  const modal = document.createElement('div');
  modal.id = 'key-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Key Detayı</h2>
      
      <div class="modal-field">
        <label>Müşteri / Not</label>
        <div class="value">${escapeHtml(record.note || '—')}</div>
      </div>
      
      <div class="modal-field">
        <label>Hesap ID</label>
        <div class="value mono">${record.accountIdFormatted}</div>
      </div>
      
      <div class="modal-field">
        <label>Tarih / Platform / Süre / Seq</label>
        <div class="value">${date} • ${platform.toUpperCase()} • ${record.days || '?'} gün • #${record.seq}</div>
      </div>
      
      ${record.rootCode ? `
      <div class="modal-field">
        <label>🔑 Kök Kod</label>
        <div class="value mono" id="modal-root">${formatCode(record.rootCode)}</div>
      </div>` : ''}
      
      <div class="modal-field">
        <label>🔑 Lisans Anahtarı</label>
        <div class="value mono" id="modal-key">${formatCode(record.key)}</div>
      </div>
      
      <div class="modal-actions">
        ${record.rootCode ? '<button class="btn btn-primary" onclick="copyFromModal(\'modal-root\', this)">📋 Kök Kodu Kopyala</button>' : ''}
        <button class="btn btn-primary" onclick="copyFromModal('modal-key', this)">📋 Anahtarı Kopyala</button>
        <button class="btn btn-secondary" onclick="closeKeyModal()">Kapat</button>
      </div>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeKeyModal();
  });
  
  document.body.appendChild(modal);
}

window.copyFromModal = function(elementId, button) {
  const element = document.getElementById(elementId);
  const text = element.textContent.replace(/\s/g, '');
  
  navigator.clipboard.writeText(text).then(() => {
    const orig = button.textContent;
    button.textContent = '✅ Kopyalandı!';
    setTimeout(() => { button.textContent = orig; }, 2000);
  }).catch(err => alert('Kopyalama hatası: ' + err.message));
};

window.closeKeyModal = function() {
  const modal = document.getElementById('key-modal');
  if (modal) modal.remove();
};

// ── Otomatik Kilit (10 dakika hareketsizlik) ────────────────────────────
let lastActivity = Date.now();

function resetActivity() {
  lastActivity = Date.now();
}

document.addEventListener('mousemove', resetActivity);
document.addEventListener('keypress', resetActivity);
document.addEventListener('click', resetActivity);

setInterval(async () => {
  const inactiveTime = Date.now() - lastActivity;
  
  // 10 dakika (600000 ms) hareketsizlik
  if (inactiveTime > 600000 && currentScreen !== 'lock') {
    await window.adminApi.lock();
    showScreen('lock');
    passwordInput.value = '';
    errorMsg.classList.add('hidden');
    showError('Güvenlik nedeniyle otomatik kilitlendi');
  }
}, 30000); // Her 30 saniyede bir kontrol

// Pencere kapanınca kilitle
window.addEventListener('beforeunload', async () => {
  await window.adminApi.lock();
});
