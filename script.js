const bannedGuns = [7,8,12,11,16,17,18,35,36,37,39,40,42,44];

// Черный список запрещенных к выдаче (красных) скинов
const bannedSkins = [
  1, 2, 3, 4, 10, 21, 50, 60, 75, 100, 120, 150, 200, 260, 300, 
  7000, 7001, 7002, 9000, 9999 
];

let playerIds = [];
let activeGeneratedCommands = []; 

let savedHp = "";
let savedArmor = "";

const idList = document.getElementById('idList');
const commandOutput = document.getElementById('commandOutput');
const errorBox = document.getElementById('errorBox');
const resetBtn = document.getElementById('resetBtn');
const tpCheck = document.getElementById('tpCheck');
const generateBtn = document.getElementById('generateBtn');
const fileInput = document.getElementById('fileInput');
const fullStatsCheck = document.getElementById('fullStatsCheck');
const exportFileBtn = document.getElementById('exportFileBtn');

const hpInput = document.getElementById('health');
const armorInput = document.getElementById('armor');

// Элементы модального окна тем
const themeToggleBtn = document.getElementById('themeToggle');
const themeModal = document.getElementById('themeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const themeOptButtons = document.querySelectorAll('.theme-opt-btn');


const toastEl = document.getElementById('toast');
const metaEl = document.getElementById('commandsMeta');
const progressBar = document.getElementById('progressBar');
let toastTimer;
let totalCommands = 0;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1400);
}

function updateMeta() {
  const left = commandOutput.querySelectorAll('.command-line:not(.collapsing)').length;
  if (!totalCommands) { metaEl.innerHTML = ''; progressBar.style.width = '0'; return; }
  metaEl.innerHTML = `Осталось: <b>${left}</b> из <b>${totalCommands}</b>`;
  progressBar.style.width = ((totalCommands - left) / totalCommands * 100) + '%';
}

fullStatsCheck.addEventListener('change', () => {
  if (fullStatsCheck.checked) {
    savedHp = hpInput.value;
    savedArmor = armorInput.value;
    hpInput.value = "150";
    armorInput.value = "320";
    hpInput.disabled = true;
    armorInput.disabled = true;
  } else {
    hpInput.disabled = false;
    armorInput.disabled = false;
    hpInput.value = savedHp;
    armorInput.value = savedArmor;
  }
});

function showError(msg) {
  errorBox.style.display = 'block';
  errorBox.textContent = msg;
}

function clearError() {
  errorBox.style.display = 'none';
  errorBox.textContent = '';
}

function updateGenerateState() {
  generateBtn.disabled = playerIds.length === 0;
}

function addPlayer() {
  const input = document.getElementById('playerIdInput');
  const rawValue = input.value.trim();
  
  if (!rawValue) return;

  const tokens = rawValue.split(/\s+/);
  let addedCount = 0;
  let hasInvalid = false;

  tokens.forEach(token => {
    if (/^\d+$/.test(token)) {
      if (!playerIds.includes(token)) {
        playerIds.push(token);
        addedCount++;
      }
    } else {
      hasInvalid = true;
    }
  });

  if (hasInvalid) {
    showError('Некоторые введенные элементы не являются корректными числовыми ID');
  } else {
    clearError();
  }

  if (addedCount > 0) {
    updateIdList();
    updateGenerateState();
  }

  input.value = '';
}

function updateIdList() {
  idList.innerHTML = '';
  playerIds.forEach(id => {
    const span = document.createElement('span');
    span.textContent = id;
    span.title = 'Удалить';
    span.onclick = () => {
      playerIds = playerIds.filter(x => x !== id);
      updateIdList();
      updateGenerateState();
      clearError();
    };
    idList.appendChild(span);
  });
}

function clearPlayers() {
  playerIds = [];
  updateIdList();
  resetCommands();
  clearError();
  updateGenerateState();
}

function validateNumber(value, min, max) {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return false;
  const num = parseInt(value, 10);
  if (num < min || num > max) return false;
  return num;
}

function checkWeaponWarnings(wpId) {
  if (wpId === 38) {
    alert('Внимание: при использовании оружия ID 38 несколькими игроками возможен вылет.');
  }
  if (wpId === 23) {
    alert('Внимание: у игроков вне силовых структур будет кик античитом при ударе тайзером.');
  }
}

function generateCommands() {
  clearError();
  commandOutput.innerHTML = '';
  activeGeneratedCommands = [];
  exportFileBtn.disabled = true;

  if (playerIds.length === 0) {
    showError('Добавьте хотя бы одного игрока');
    return;
  }

  const skin1Str = document.getElementById('skin1').value.trim();
  const skin2Str = document.getElementById('skin2').value.trim();
  
  const weaponIdStr = document.getElementById('weaponId').value.trim();
  const ammoStr = document.getElementById('ammo').value.trim();
  
  const weaponIdStr2 = document.getElementById('weaponId2').value.trim();
  const ammoStr2 = document.getElementById('ammo2').value.trim();
  
  const hpStr = hpInput.value.trim();
  const armorStr = armorInput.value.trim();

  if (skin1Str) {
    if (!/^\d+$/.test(skin1Str)) return showError('Скин 1 должен содержать только цифры');
    const s1 = parseInt(skin1Str, 10);
    if (bannedSkins.includes(s1)) return showError(`Генерация заблокирована: Скин ${s1} является запрещенным!`);
  }
  if (skin2Str) {
    if (!/^\d+$/.test(skin2Str)) return showError('Скин 2 должен содержать только цифры');
    const s2 = parseInt(skin2Str, 10);
    if (bannedSkins.includes(s2)) return showError(`Генерация заблокирована: Скин ${s2} является запрещенным!`);
  }

  if (weaponIdStr && !/^\d+$/.test(weaponIdStr)) return showError('ID оружия 1 должен быть числом');
  let weaponId = weaponIdStr ? parseInt(weaponIdStr, 10) : null;
  if (weaponId !== null && bannedGuns.includes(weaponId)) return showError('Оружие 1 запрещено к выдаче.');
  
  const ammo = validateNumber(ammoStr, 0, 2000);
  if (weaponId !== null && ammo === false) return showError('Патроны 1 должны быть числом от 0 до 2000');

  if (weaponIdStr2 && !/^\d+$/.test(weaponIdStr2)) return showError('ID оружия 2 должен быть числом');
  let weaponId2 = weaponIdStr2 ? parseInt(weaponIdStr2, 10) : null;
  if (weaponId2 !== null && bannedGuns.includes(weaponId2)) return showError('Оружие 2 запрещено к выдаче.');
  
  const ammo2 = validateNumber(ammoStr2, 0, 2000);
  if (weaponId2 !== null && ammo2 === false) return showError('Патроны 2 должны быть числом от 0 до 2000');

  if (weaponId !== null) checkWeaponWarnings(weaponId);
  if (weaponId2 !== null) checkWeaponWarnings(weaponId2);

  const hp = validateNumber(hpStr, 0, 150);
  if (hp === false) return showError('HP должно быть числом от 0 до 150');

  const armor = validateNumber(armorStr, 0, 320);
  if (armor === false) return showError('Броня должна быть числом от 0 до 320');

  const half = Math.ceil(playerIds.length / 2);

  if (tpCheck.checked) {
    playerIds.forEach(id => activeGeneratedCommands.push(`/get ${id}`));
  }

  playerIds.forEach((id, idx) => {
    if (skin1Str) {
      const skin = (skin2Str && idx >= half) ? skin2Str : skin1Str;
      activeGeneratedCommands.push(`/tempskin ${id} ${skin}`);
    }
    if (weaponId !== null && ammo > 0) {
      activeGeneratedCommands.push(`/weapongive ${id} ${weaponId} ${ammo}`);
    }
    if (weaponId2 !== null && ammo2 > 0) {
      activeGeneratedCommands.push(`/weapongive ${id} ${weaponId2} ${ammo2}`);
    }
    if (hp !== null) {
      activeGeneratedCommands.push(`/sethp ${id} ${hp}`);
    }
    if (armor !== null) {
      activeGeneratedCommands.push(`/setarmor ${id} ${armor}`);
    }
  });

  if (activeGeneratedCommands.length === 0) {
    showError('Нет данных для генерации команд');
    return;
  }

  totalCommands = activeGeneratedCommands.length;
  activeGeneratedCommands.forEach(addCommand);
  updateMeta();
  resetBtn.style.display = 'inline-block';
  exportFileBtn.disabled = false;
}

function addCommand(text) {
  const div = document.createElement('div');
  div.textContent = text;
  div.className = 'command-line';
  div.title = 'Клик для копирования';
  
  div.onclick = () => {
    navigator.clipboard.writeText(text);
    showToast('Скопировано');
    
    const currentHeight = div.offsetHeight;
    div.style.height = currentHeight + 'px';
    
    requestAnimationFrame(() => {
      div.classList.add('collapsing');
      updateMeta();
    });

    setTimeout(() => {
      div.remove();
      if (!commandOutput.querySelector('.command-line')) {
        commandOutput.innerHTML = '<div class="done-text">Все команды выданы</div>';
        totalCommands = 0;
        updateMeta();
        resetBtn.style.display = 'none';
        exportFileBtn.disabled = true;
      }
    }, 350);
  };
  commandOutput.appendChild(div);
}

function resetCommands() {
  totalCommands = 0;
  updateMeta();
  commandOutput.innerHTML = '';
  activeGeneratedCommands = [];
  resetBtn.style.display = 'none';
  exportFileBtn.disabled = true;
}

function exportToTxt() {
  if (activeGeneratedCommands.length === 0) return;
  
  const fileContent = activeGeneratedCommands.join('\r\n');
  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  
  link.href = URL.createObjectURL(blob);
  link.download = 'generated_commands.txt';
  link.click();
  
  URL.revokeObjectURL(link.href);
}

function applyPreset(name) {
  if (fullStatsCheck.checked) {
    fullStatsCheck.checked = false;
    hpInput.disabled = false;
    armorInput.disabled = false;
  }

  document.getElementById('weaponId2').value = '';
  document.getElementById('ammo2').value = '';

  switch (name) {
    case 'cs':
      document.getElementById('skin1').value = '43';
      document.getElementById('skin2').value = '6840';
      document.getElementById('weaponId').value = '57';
      document.getElementById('ammo').value = '1000';
      hpInput.value = '150';
      armorInput.value = '320';
      break;
    case 'ffa':
      document.getElementById('skin1').value = '45';
      document.getElementById('skin2').value = '';
      document.getElementById('weaponId').value = '57';
      document.getElementById('ammo').value = '1000';
      hpInput.value = '150';
      armorInput.value = '320';
      break;
    case 'bats':
      document.getElementById('skin1').value = '107';
      document.getElementById('skin2').value = '';
      document.getElementById('weaponId').value = '5';
      document.getElementById('ammo').value = '1';
      hpInput.value = '100';
      armorInput.value = '';
      break;
    default:
      break;
  }
}

/* --- МЕНЕДЖЕР ТЕМ С МОДАЛЬНЫМ ОКНОМ --- */
themeToggleBtn.addEventListener('click', () => {
  themeModal.classList.add('open');
});

closeModalBtn.addEventListener('click', () => {
  themeModal.classList.remove('open');
});

// Закрытие модального окна при клике на бэкграунд оверлея
themeModal.addEventListener('click', (e) => {
  if (e.target === themeModal) {
    themeModal.classList.remove('open');
  }
});

themeOptButtons.forEach(button => {
  button.addEventListener('click', () => {
    const chosenTheme = button.getAttribute('data-theme');
    
    // Удаляем все старые темы с тега body
    document.body.className = '';
    // Вешаем выбранную премиум-тему
    document.body.classList.add(chosenTheme);
    
    // Снимаем класс active у всех кнопок и вешаем на текущую
    themeOptButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    try { localStorage.setItem('ih-theme', chosenTheme); } catch (e) {}
    setTimeout(() => themeModal.classList.remove('open'), 200);
  });
});

// Восстановление сохранённой темы
try {
  const saved = localStorage.getItem('ih-theme');
  const btn = saved && document.querySelector(`.theme-opt-btn[data-theme="${saved}"]`);
  if (btn) {
    document.body.className = saved;
    themeOptButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
} catch (e) {}

function loadFromFile() {
  fileInput.click();
}

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    const lines = event.target.result.split(/\r?\n/);
    lines.forEach(line => {
      const id = line.trim();
      if (id && /^\d+$/.test(id) && !playerIds.includes(id)) {
        playerIds.push(id);
      }
    });
    updateIdList();
    updateGenerateState();
  };
  reader.readAsText(file);
});

document.getElementById('playerIdInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addPlayer();
});

document.getElementById('addPlayerBtn').onclick = addPlayer;
document.getElementById('clearPlayersBtn').onclick = clearPlayers;
document.getElementById('generateBtn').onclick = generateCommands;
document.getElementById('resetBtn').onclick = resetCommands;
document.getElementById('exportFileBtn').onclick = exportToTxt;
document.getElementById('loadFileBtn').onclick = loadFromFile;

/* --- КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК --- */
(function initDropdown() {
  const sel = document.getElementById('presetSelector');
  if (!sel) return;
  const dd = document.createElement('div');
  dd.className = 'dd';
  dd.innerHTML = '<button type="button" class="dd-btn" aria-haspopup="listbox" aria-expanded="false"><span class="dd-label"></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><ul class="dd-list" role="listbox"></ul>';
  const btn = dd.querySelector('.dd-btn');
  const label = dd.querySelector('.dd-label');
  const list = dd.querySelector('.dd-list');

  [...sel.options].forEach(opt => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.value = opt.value;
    li.textContent = opt.textContent.replace(/^—\s*|\s*—$/g, '');
    list.appendChild(li);
  });

  const items = [...list.children];
  const setOpen = open => {
    dd.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  };
  const choose = li => {
    sel.value = li.dataset.value;
    label.textContent = li.dataset.value ? li.textContent : 'Выберите пресет';
    dd.classList.toggle('has-value', !!li.dataset.value);
    items.forEach(i => i.classList.toggle('active', i === li));
    applyPreset(sel.value);
    setOpen(false);
  };
  label.textContent = 'Выберите пресет';
  items[0].classList.add('active');

  btn.addEventListener('click', () => setOpen(!dd.classList.contains('open')));
  list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) choose(li); });
  document.addEventListener('click', e => { if (!dd.contains(e.target)) setOpen(false); });
  dd.addEventListener('keydown', e => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const cur = items.findIndex(i => i.classList.contains('active'));
      const next = Math.min(items.length - 1, Math.max(0, cur + (e.key === 'ArrowDown' ? 1 : -1)));
      choose(items[next]);
      setOpen(true);
    }
  });

  sel.style.display = 'none';
  sel.after(dd);
})();

/* --- КАСТОМНЫЕ СТЕПЕРЫ ДЛЯ ЧИСЛОВЫХ ПОЛЕЙ --- */
document.querySelectorAll('input[type="number"]').forEach(input => {
  const wrap = document.createElement('div');
  wrap.className = 'num-wrap';
  input.before(wrap);
  wrap.appendChild(input);
  const steps = document.createElement('div');
  steps.className = 'steps';
  steps.innerHTML = '<button type="button" tabindex="-1" aria-label="Больше" data-d="1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg></button><button type="button" tabindex="-1" aria-label="Меньше" data-d="-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>';
  wrap.appendChild(steps);
  steps.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || input.disabled) return;
    const step = e.shiftKey ? 10 : 1;
    const min = +input.min, max = +input.max;
    const v = (parseInt(input.value, 10) || 0) + (+b.dataset.d) * step;
    input.value = Math.min(max, Math.max(min, v));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
});
