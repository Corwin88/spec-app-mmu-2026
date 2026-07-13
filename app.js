// ============================================================
// НАСТРОЙКИ — здесь можно поменять пароль входа.
// Это лёгкий барьер (данные и так внутри приложения), а не
// настоящая защита данных — так и было задумано.
// ============================================================
const APP_PASSWORD = "mmu2026";
const LOCK_STORAGE_KEY = "specapp_unlocked_v1";

// ============================================================
// Экраны
// ============================================================
const lockScreen = document.getElementById('lockScreen');
const mainScreen = document.getElementById('mainScreen');
const passwordInput = document.getElementById('passwordInput');
const unlockBtn = document.getElementById('unlockBtn');
const lockError = document.getElementById('lockError');
const lockAgainBtn = document.getElementById('lockAgainBtn');

function showMain() {
  lockScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
  setTimeout(() => searchInput.focus(), 50);
}

function showLock() {
  mainScreen.classList.add('hidden');
  lockScreen.classList.remove('hidden');
  passwordInput.value = '';
  lockError.textContent = '';
  setTimeout(() => passwordInput.focus(), 50);
}

function tryUnlock() {
  if (passwordInput.value === APP_PASSWORD) {
    try { localStorage.setItem(LOCK_STORAGE_KEY, '1'); } catch (e) {}
    showMain();
  } else {
    lockError.textContent = 'Неверный пароль';
    passwordInput.value = '';
    passwordInput.focus();
  }
}

unlockBtn.addEventListener('click', tryUnlock);
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tryUnlock();
});
lockAgainBtn.addEventListener('click', () => {
  try { localStorage.removeItem(LOCK_STORAGE_KEY); } catch (e) {}
  showLock();
});

// Уже вводили пароль раньше на этом устройстве?
let alreadyUnlocked = false;
try { alreadyUnlocked = localStorage.getItem(LOCK_STORAGE_KEY) === '1'; } catch (e) {}
if (alreadyUnlocked) {
  showMain();
} else {
  showLock();
}

// ============================================================
// Поиск специальностей
// ============================================================
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const suggestionsEl = document.getElementById('suggestions');
const resultCard = document.getElementById('resultCard');
const emptyState = document.getElementById('emptyState');
const statusLine = document.getElementById('statusLine');

statusLine.textContent = `База: ${SPECIALTIES.length} специальностей СПО`;

function normalize(str) {
  return str.toLowerCase().replace(/ё/g, 'е');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const idx = normalize(text).indexOf(normalize(query));
  if (idx === -1) return escapeHtml(text);
  const before = escapeHtml(text.slice(0, idx));
  const match = escapeHtml(text.slice(idx, idx + query.length));
  const after = escapeHtml(text.slice(idx + query.length));
  return `${before}<mark>${match}</mark>${after}`;
}

function search(query) {
  const q = normalize(query.trim());
  if (!q) return [];
  return SPECIALTIES.filter(s => {
    const full = normalize(s.code + ' ' + s.name);
    return full.includes(q);
  }).slice(0, 30);
}

function renderSuggestions(query) {
  const matches = search(query);

  if (!query.trim()) {
    suggestionsEl.classList.add('hidden');
    suggestionsEl.innerHTML = '';
    return;
  }

  if (matches.length === 0) {
    suggestionsEl.classList.remove('hidden');
    suggestionsEl.innerHTML = `<div class="suggestions-empty">Ничего не найдено. Попробуйте другой код или часть названия.</div>`;
    return;
  }

  suggestionsEl.innerHTML = matches.map((s, i) => `
    <div class="suggestion-item" data-index="${i}">
      <span class="suggestion-code">${escapeHtml(s.code)}</span>${highlight(s.name, query)}
    </div>
  `).join('');
  suggestionsEl.classList.remove('hidden');

  suggestionsEl.querySelectorAll('.suggestion-item').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-index'), 10);
      selectSpecialty(matches[idx]);
    });
  });
}

function selectSpecialty(spec) {
  searchInput.value = `${spec.code} ${spec.name}`;
  suggestionsEl.classList.add('hidden');
  suggestionsEl.innerHTML = '';
  clearBtn.classList.remove('hidden');
  renderResult(spec);
  searchInput.blur();
}

function renderResult(spec) {
  emptyState.classList.add('hidden');
  resultCard.classList.remove('hidden');

  const dirsHtml = spec.directions.map(d => `
    <div class="direction-item">
      <div class="dcode">${escapeHtml(d.code)}</div>
      <div class="dname">${escapeHtml(d.name)}</div>
    </div>
  `).join('');

  const multiNote = spec.directions.length > 1
    ? `<div class="direction-multi-note">Эта специальность СПО подходит сразу под ${spec.directions.length} направления подготовки.</div>`
    : '';

  resultCard.innerHTML = `
    <div class="spec-title">Специальность СПО</div>
    <div class="spec-name">${escapeHtml(spec.name)}</div>
    <div class="spec-code">${escapeHtml(spec.code)}</div>
    <div class="direction-label">Подходящее направление подготовки</div>
    ${dirsHtml}
    ${multiNote}
  `;
}

function clearResult() {
  resultCard.classList.add('hidden');
  resultCard.innerHTML = '';
  emptyState.classList.remove('hidden');
}

searchInput.addEventListener('input', () => {
  const val = searchInput.value;
  clearBtn.classList.toggle('hidden', val.length === 0);
  if (val.length === 0) clearResult();
  renderSuggestions(val);
});

searchInput.addEventListener('focus', () => {
  if (searchInput.value.trim()) renderSuggestions(searchInput.value);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap') && !e.target.closest('.suggestions')) {
    suggestionsEl.classList.add('hidden');
  }
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearBtn.classList.add('hidden');
  suggestionsEl.classList.add('hidden');
  clearResult();
  searchInput.focus();
});

// ============================================================
// Service worker (офлайн-режим)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
