// Simple clicker game (vanilla JS)

const countEl = document.getElementById('count');
const perClickEl = document.getElementById('perClick');
const cpsEl = document.getElementById('cps');
const bigClick = document.getElementById('bigClick');
const upgradesEl = document.getElementById('upgrades');
const resetBtn = document.getElementById('reset');
const saveNowBtn = document.getElementById('saveNow');
const autosaveToggle = document.getElementById('autosaveToggle');

let state = {
  total: 0,
  perClick: 1,
  cps: 0,
  totalClicks: 0,
  upgrades: {
    cursor: { name: "Cursor", level: 0, baseCost: 15, perClick: 1, type: "click" },
    grandma: { name: "AutoClicker", level: 0, baseCost: 100, cps: 1, type: "cps" },
    factory: { name: "Factory", level: 0, baseCost: 1200, cps: 10, type: "cps" }
  },
  lastSaved: null
};

const UPGRADE_KEYS = Object.keys(state.upgrades);

function formatNumber(n) {
  if (n >= 1e12) return (n/1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n/1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n/1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n/1e3).toFixed(2) + "K";
  return Math.floor(n).toString();
}

function upgradeCost(upg){
  // exponential cost scaling
  return Math.floor(upg.baseCost * Math.pow(1.15, upg.level));
}

function renderUpgrades(){
  upgradesEl.innerHTML = '';
  UPGRADE_KEYS.forEach(key => {
    const u = state.upgrades[key];
    const cost = upgradeCost(u);
    const div = document.createElement('div');
    div.className = 'upgrade';
    div.innerHTML = `
      <h3>${u.name} (Lv ${u.level})</h3>
      <div class="desc">
        ${u.type === 'click' ? `+${u.perClick} per click` : `+${u.cps} CPS`}
      </div>
      <div class="row">
        <div style="color:var(--muted);font-size:13px">Cost: ${formatNumber(cost)}</div>
        <button class="buy" data-key="${key}">Buy</button>
      </div>
    `;
    upgradesEl.appendChild(div);
    const btn = div.querySelector('.buy');
    btn.disabled = state.total < cost;
    btn.addEventListener('click', () => buyUpgrade(key));
  });
}

function updateUI(){
  countEl.textContent = formatNumber(state.total);
  perClickEl.textContent = `Per Click: ${formatNumber(state.perClick)}`;
  cpsEl.textContent = `CPS: ${formatNumber(state.cps)}`;
  renderUpgrades();
}

function buyUpgrade(key){
  const u = state.upgrades[key];
  const cost = upgradeCost(u);
  if (state.total < cost) return;
  state.total -= cost;
  u.level += 1;
  // Apply effect
  if (u.type === 'click') {
    state.perClick += u.perClick;
  } else if (u.type === 'cps') {
    state.cps += u.cps;
  }
  updateUI();
}

bigClick.addEventListener('click', () => {
  state.total += state.perClick;
  state.totalClicks += 1;
  animateClick();
  updateUI();
});

function animateClick(){
  bigClick.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(0.96)' },
    { transform: 'scale(1)' }
  ], { duration: 120, easing: 'ease-out' });
}

// keyboard support: space to click
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    bigClick.click();
  }
});

function tickCPS(){
  // add CPS each second
  state.total += state.cps;
  updateUI();
}

// Save/load
function save(){
  state.lastSaved = new Date().toISOString();
  localStorage.setItem('clicker.save.v1', JSON.stringify(state));
  flashSaved();
}

function load(){
  const raw = localStorage.getItem('clicker.save.v1');
  if (!raw) return;
  try {
    const obj = JSON.parse(raw);
    // basic migration/validation
    if (typeof obj.total === 'number') {
      state = Object.assign(state, obj);
    }
  } catch (e) {
    console.warn('Failed to load save', e);
  }
}

function reset(){
  if (!confirm('Reset progress? This cannot be undone.')) return;
  localStorage.removeItem('clicker.save.v1');
  // reload to cleanly reset
  location.reload();
}

saveNowBtn.addEventListener('click', save);
resetBtn.addEventListener('click', reset);
autosaveToggle.addEventListener('change', () => {
  // handled by interval check; nothing else needed here
});

function flashSaved(){
  const el = document.createElement('div');
  el.textContent = 'Saved';
  el.style.position = 'fixed';
  el.style.right = '18px';
  el.style.bottom = '18px';
  el.style.background = 'var(--success)';
  el.style.color = '#042017';
  el.style.padding = '8px 12px';
  el.style.borderRadius = '8px';
  el.style.boxShadow = '0 6px 20px rgba(16,185,129,0.12)';
  document.body.appendChild(el);
  setTimeout(()=> el.animate([{opacity:1},{opacity:0}], {duration:900}).onfinish = () => el.remove(), 650);
}

// Autosave every 15s if enabled
setInterval(() => {
  if (autosaveToggle.checked) save();
}, 15000);

// CPS tick
setInterval(tickCPS, 1000);

// initialization
load();
updateUI();

// small tutorial starter upgrades (ensure store buttons reflect affordability)
renderUpgrades();
