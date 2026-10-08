// Renderer process - UI mantığı

let currentScreen = 'lock';
let selectedPlatform = null;
let selectedDays = null;
let decodedRequest = null;

// DOM elementleri
const screens = {
  lock: document.getElementById('lock-screen'),
  platform: document.getElementById('platform-screen'),
  keygen: document.getElementById('keygen-screen')
};

const lockElements = {
  passwordInput: document.getElementById('password-input'),
  unlockBtn: document.getElementById('unlock-btn'),
  lockError: document.getElementById('lock-error'),
  firstSetup: document.getElementById('first-setup'),
  setupPassword: document.getElementById('setup-password'),
  setupPasswordConfirm: document.getElementById('setup-password-confirm'),
  setupBtn: document.getElementById('setup-btn'),
  setupError: document.getElementById('setup-error'),
  lockMessage: document.getElementById('lock-message')
};

const platformElements = {
  buttons: document.querySelectorAll('.platform-btn'),
  logoutBtn: document.getElementById('logout-btn')
};

const keygenElements = {
  backBtn: document.getElementById('back-btn'),
  platformTitle: document.getElementById('platform-title'),
  requestCodeInput: document.getElementById('request-code-input'),
  requestError: document.getElementById('request-error'),
  requestInfo: document.getElementById('request-info'),
  infoAccountId: document.getElementById('info-account-id'),
  infoDeviceAnchor: document.getElementById('info-device-anchor'),
  durationBtns: document.querySelectorAll('.duration-btn'),
  customDaysInput: document.getElementById('custom-days-input'),
  customDays: document.getElementById('custom-days'),
  durationError: document.getElementById('duration-error'),
  generateBtn: document.getElementById('generate-btn'),
  resultSection: document.getElementById('result-section'),
  generatedKey: document.getElementById('generated-key'),
  copyKeyBtn: document.getElementById('copy-key-btn'),
  resultKeyId: document.getElementById('result-key-id'),
  resultActivateBy: document.getElementById('result-activate-by'),
  resultDuration: document.getElementById('result-duration'),
  newKeyBtn: document.getElementById('new-key-btn'),
  keyHistory: document.getElementById('key-history')
};

const loading = document.getElementById('loading');

// Yardımcı fonksiyonlar
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  currentScreen = name;
}

function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

function hideError(element) {
  element.classList.add('hidden');
}

function showLoading() {
  loading.classList.remove('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

function formatDate(timestamp) {
  const d = new Date(timestamp * 1000);
  return d.toLocaleString('tr-TR');
}

// Başlangıç kontrolü
async function init() {
  const rootCheck = await window.licenseAPI.checkRootExists();
  
  if (!rootCheck.exists) {
    // İlk kurulum
    lockElements.lockMessage.textContent = 'İlk kullanım - kök anahtar oluşturun';
    lockElements.firstSetup.classList.remove('hidden');
  }
}

// EKRAN 1: Kilit
lockElements.unlockBtn.addEventListener('click', async () => {
  const password = lockElements.passwordInput.value.trim();
  
  if (!password) {
    showError(lockElements.lockError, 'Parola girin');
    return;
  }
  
  hideError(lockElements.lockError);
  showLoading();
  
  const result = await window.licenseAPI.unlock(password);
  hideLoading();
  
  if (result.success) {
    showScreen('platform');
  } else {
    showError(lockElements.lockError, result.error || 'Parola hatalı');
  }
});

lockElements.passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') lockElements.unlockBtn.click();
});

lockElements.setupBtn.addEventListener('click', async () => {
  const password = lockElements.setupPassword.value.trim();
  const confirm = lockElements.setupPasswordConfirm.value.trim();
  
  hideError(lockElements.setupError);
  
  if (!password || password.length < 8) {
    showError(lockElements.setupError, 'Parola en az 8 karakter olmalı');
    return;
  }
  
  if (password !== confirm) {
    showError(lockElements.setupError, 'Parolalar eşleşmiyor');
    return;
  }
  
  showLoading();
  const result = await window.licenseAPI.createRoot(password);
  hideLoading();
  
  if (result.success) {
    alert('Kök anahtar oluşturuldu. Public key:\n\n' + result.publicKey + '\n\nBu bilgiyi güvenli bir yere kaydedin.');
    location.reload();
  } else {
    showError(lockElements.setupError, result.error || 'Oluşturulamadı');
  }
});

// EKRAN 2: Platform seçimi
platformElements.buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedPlatform = btn.dataset.platform;
    keygenElements.platformTitle.textContent = `${selectedPlatform} Lisans Anahtarı`;
    showScreen('keygen');
    loadKeyHistory();
  });
});

platformElements.logoutBtn.addEventListener('click', () => {
  showScreen('lock');
  lockElements.passwordInput.value = '';
  hideError(lockElements.lockError);
});

// EKRAN 3: Keygen
keygenElements.backBtn.addEventListener('click', () => {
  showScreen('platform');
  resetKeygenForm();
});

keygenElements.requestCodeInput.addEventListener('input', async () => {
  const code = keygenElements.requestCodeInput.value.trim();
  hideError(keygenElements.requestError);
  keygenElements.requestInfo.classList.add('hidden');
  
  if (code.length < 20) {
    checkGenerateReady();
    return;
  }
  
  showLoading();
  const result = await window.licenseAPI.decodeRequest(code);
  hideLoading();
  
  if (result.success) {
    decodedRequest = result;
    keygenElements.infoAccountId.textContent = result.accountId;
    keygenElements.infoDeviceAnchor.textContent = result.deviceAnchor;
    keygenElements.requestInfo.classList.remove('hidden');
  } else {
    showError(keygenElements.requestError, result.error || 'İstek kodu okunamadı');
    decodedRequest = null;
  }
  
  checkGenerateReady();
});

keygenElements.durationBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    keygenElements.durationBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    const days = btn.dataset.days;
    
    if (days === 'custom') {
      keygenElements.customDaysInput.classList.remove('hidden');
      selectedDays = null;
    } else {
      keygenElements.customDaysInput.classList.add('hidden');
      selectedDays = parseInt(days);
    }
    
    hideError(keygenElements.durationError);
    checkGenerateReady();
  });
});

keygenElements.customDays.addEventListener('input', () => {
  const val = parseInt(keygenElements.customDays.value);
  hideError(keygenElements.durationError);
  
  if (val >= 1 && val <= 730) {
    selectedDays = val;
  } else {
    selectedDays = null;
  }
  
  checkGenerateReady();
});

keygenElements.generateBtn.addEventListener('click', async () => {
  if (!decodedRequest || !selectedDays) return;
  
  hideError(keygenElements.durationError);
  showLoading();
  
  const result = await window.licenseAPI.createKey({
    requestCode: keygenElements.requestCodeInput.value.trim(),
    days: selectedDays,
    platform: selectedPlatform
  });
  
  hideLoading();
  
  if (result.success) {
    keygenElements.generatedKey.value = result.key;
    keygenElements.resultKeyId.textContent = result.metadata.keyId;
    keygenElements.resultActivateBy.textContent = formatDate(result.metadata.activateBy);
    keygenElements.resultDuration.textContent = `${result.metadata.durationDays} gün`;
    keygenElements.resultSection.classList.remove('hidden');
    
    // Giriş alanlarını devre dışı bırak
    keygenElements.requestCodeInput.disabled = true;
    keygenElements.generateBtn.disabled = true;
    keygenElements.durationBtns.forEach(b => b.disabled = true);
    keygenElements.customDays.disabled = true;
  } else {
    showError(keygenElements.durationError, result.error || 'Anahtar oluşturulamadı');
  }
});

keygenElements.copyKeyBtn.addEventListener('click', () => {
  keygenElements.generatedKey.select();
  document.execCommand('copy');
  
  const originalText = keygenElements.copyKeyBtn.textContent;
  keygenElements.copyKeyBtn.textContent = '✓ Kopyalandı';
  setTimeout(() => {
    keygenElements.copyKeyBtn.textContent = originalText;
  }, 2000);
});

keygenElements.newKeyBtn.addEventListener('click', () => {
  resetKeygenForm();
  loadKeyHistory();
});

function checkGenerateReady() {
  const ready = decodedRequest !== null && selectedDays !== null;
  keygenElements.generateBtn.disabled = !ready;
}

function resetKeygenForm() {
  keygenElements.requestCodeInput.value = '';
  keygenElements.requestCodeInput.disabled = false;
  keygenElements.customDays.value = '';
  keygenElements.durationBtns.forEach(b => {
    b.classList.remove('selected');
    b.disabled = false;
  });
  keygenElements.customDaysInput.classList.add('hidden');
  keygenElements.requestInfo.classList.add('hidden');
  keygenElements.resultSection.classList.add('hidden');
  keygenElements.generateBtn.disabled = true;
  keygenElements.customDays.disabled = false;
  
  hideError(keygenElements.requestError);
  hideError(keygenElements.durationError);
  
  decodedRequest = null;
  selectedDays = null;
}

async function loadKeyHistory() {
  const result = await window.licenseAPI.listKeys({ limit: 10 });
  
  if (!result.success || !result.keys || result.keys.length === 0) {
    keygenElements.keyHistory.innerHTML = '<p style="color:#999; text-align:center;">Henüz anahtar oluşturulmamış</p>';
    return;
  }
  
  keygenElements.keyHistory.innerHTML = result.keys.map(k => `
    <div class="history-item">
      <div class="key-id">${k.keyId}</div>
      <div class="meta">
        ${formatDate(k.issuedAt)} · ${k.durationDays} gün · Hesap: ${k.accountId.substring(0, 14)}
      </div>
    </div>
  `).join('');
}

// Otomatik kilit eventi
window.licenseAPI.onAutoLocked(() => {
  alert('Oturum zaman aşımı - tekrar giriş yapın');
  showScreen('lock');
  lockElements.passwordInput.value = '';
});

// Başlat
init();
