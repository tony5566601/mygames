const { createGame, stepGame, chooseUpgrade, experienceNeeded, HEROES, UPGRADES, STEP, DURATION, WORLD } = globalThis.ThreeKingdomsSimulation;

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const overlayContent = document.querySelector('#overlay-content');
const hud = document.querySelector('#hud');
const controls = document.querySelector('#mobile-controls');
const heroButtons = [...document.querySelectorAll('.hero-card')];
const input = { up: false, down: false, left: false, right: false };
const keyMap = { w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' };
const keys = new Set();
const pointers = new Map();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
let selectedHero = 'guanyu';
let state = null;
let paused = false;
let lastFrame = 0;
let accumulator = 0;
let displayedStatus = '';

function syncInput() {
  for (const direction of Object.keys(input)) input[direction] = [...keys].some(key => keyMap[key] === direction) || [...pointers.values()].includes(direction);
}
function clearInput() { keys.clear(); pointers.clear(); syncInput(); }
function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
function setOverlay(content) { overlayContent.innerHTML = content; overlay.classList.remove('hidden'); }
function showStart() {
  setOverlay('<div class="overline">黃 巾 之 亂　 ·　 生 存 試 煉</div><h2>亂世之中，<em>殺出重圍</em></h2><p>敵軍四面而來，唯有戰鬥才能生存。<br>選擇武將，迎接屬於你的試煉。</p><div class="overlay-divider"></div><button class="start-button" id="start">開始出征　 →</button><p class="start-hint">WASD / 方向鍵移動　 ·　 自動攻擊　 ·　 存活 03:00</p>');
  document.querySelector('#start').addEventListener('click', startGame);
}
function startGame() {
  state = createGame(selectedHero);
  paused = false;
  accumulator = 0;
  lastFrame = 0;
  displayedStatus = '';
  clearInput();
  heroButtons.forEach(button => { button.disabled = true; });
  hud.classList.remove('hidden');
  controls.classList.remove('hidden');
  overlay.classList.add('hidden');
  updateHud();
}
function finishGame() {
  clearInput();
  heroButtons.forEach(button => { button.disabled = false; });
  controls.classList.add('hidden');
  const won = state.status === 'won';
  setOverlay(`<div class="overline"> ${won ? '凱 旋 而 歸' : '此 戰 暫 歇'} </div><h2>${won ? '戰<em>勝</em>歸來' : '雖敗<em>猶榮</em>'}</h2><p>${won ? '成功堅守戰場，黃巾軍已潰退！' : '英雄不懼失敗，整裝再戰。'}<br>存活 ${formatTime(state.time)}　 ·　 擊敗 ${state.kills} 名敵軍　 ·　 等級 ${state.player.level}</p><div class="overlay-divider"></div><button class="action-button" id="retry">再次出征　 →</button><p class="start-hint">可先在右側重新選擇武將</p>`);
  document.querySelector('#retry').addEventListener('click', startGame);
}
function showUpgrades() {
  clearInput();
  controls.classList.add('hidden');
  const cards = state.upgrades.map(id => {
    const upgrade = UPGRADES[id];
    return `<button class="upgrade" data-upgrade="${id}"><span class="upgrade-icon">${upgrade.icon}</span><strong>${upgrade.name}</strong><small>${upgrade.description}</small></button>`;
  }).join('');
  setOverlay(`<div class="overline">實 力 精 進</div><h2>武將<em>升級</em></h2><p>選擇一項能力，繼續征戰</p><div class="upgrade-grid">${cards}</div>`);
  overlayContent.querySelectorAll('[data-upgrade]').forEach(button => button.addEventListener('click', () => {
    chooseUpgrade(state, button.dataset.upgrade);
    accumulator = 0;
    if (state.status === 'playing') { overlay.classList.add('hidden'); controls.classList.remove('hidden'); }
    else showUpgrades();
    displayedStatus = state.status;
    updateHud();
  }));
}
function togglePause() {
  if (!state || state.status !== 'playing') return;
  paused = !paused;
  clearInput();
  accumulator = 0;
  if (paused) {
    controls.classList.add('hidden');
    setOverlay('<div class="overline">休 整 片 刻</div><h2>戰鬥<em>暫停</em></h2><p>養精蓄銳，再戰沙場。</p><button class="action-button" id="resume">繼續戰鬥　 →</button>');
    document.querySelector('#resume').addEventListener('click', togglePause);
  } else { overlay.classList.add('hidden'); controls.classList.remove('hidden'); }
}
heroButtons.forEach(button => button.addEventListener('click', () => {
  selectedHero = button.dataset.hero;
  heroButtons.forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  if (!state) drawScene(createGame(selectedHero, 1), true);
}));
document.querySelector('#pause').addEventListener('click', togglePause);
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (keyMap[key]) { event.preventDefault(); keys.add(key); syncInput(); }
  if (key === 'escape' && !event.repeat) togglePause();
});
document.addEventListener('keyup', event => { keys.delete(event.key.toLowerCase()); syncInput(); });
window.addEventListener('blur', () => { clearInput(); if (state && state.status === 'playing' && !paused) togglePause(); });
controls.querySelectorAll('[data-dir]').forEach(button => {
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, button.dataset.dir); syncInput(); });
  const release = event => { pointers.delete(event.pointerId); syncInput(); };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

function updateHud() {
  const p = state.player;
  document.querySelector('#hud-name').textContent = HEROES[state.heroId].name;
  document.querySelector('#hud-title').textContent = HEROES[state.heroId].title;
  document.querySelector('#hud-avatar').textContent = HEROES[state.heroId].name[0];
  document.querySelector('#timer').textContent = formatTime(Math.min(state.time, DURATION));
  document.querySelector('#health-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  document.querySelector('#health-fill').style.width = `${p.hp / p.maxHp * 100}%`;
  document.querySelector('#level').textContent = `LV. ${p.level}`;
  document.querySelector('#xp-fill').style.width = `${Math.min(100, p.xp / experienceNeeded(p.level) * 100)}%`;
  document.querySelector('#kills').textContent = state.kills;
}

function circle(x, y, radius, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); }
function drawSoldier(x, y, type, facing = 1, hit = false) {
  const boss = type === 'boss';
  const hero = ['guanyu', 'zhaoyun', 'zhugeliang'].includes(type);
  const size = boss ? 1.65 : hero ? 1.15 : type === 'elite' ? 1.2 : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  ctx.fillStyle = '#0b180f66'; ctx.beginPath(); ctx.ellipse(0, 15, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
  const robe = hit ? '#efdfb6' : ({ guanyu: '#315f42', zhaoyun: '#bac9bd', zhugeliang: '#777d9a', boss: '#933a2b', elite: '#876536', soldier: '#77713f' })[type];
  ctx.fillStyle = robe; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-14, 14); ctx.lineTo(13, 14); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#35382b'; ctx.fillRect(-8, 11, 6, 8); ctx.fillRect(3, 11, 6, 8);
  circle(0, -6, 8, '#d0aa7c');
  ctx.fillStyle = hero ? '#252d25' : '#aa8c3d'; ctx.fillRect(-8, -14, 16, 5);
  if (type === 'guanyu') { ctx.fillStyle = '#302e25'; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(0, 12); ctx.lineTo(5, -2); ctx.fill(); }
  if (type === 'zhugeliang') { ctx.fillStyle = '#303d44'; ctx.fillRect(-7, -21, 14, 10); }
  ctx.strokeStyle = hero ? '#d9c99d' : '#49372b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(facing * 8, 4); ctx.lineTo(facing * 20, -14); ctx.stroke();
  if (boss) { ctx.fillStyle = '#e3b65e'; ctx.fillRect(-11, -18, 22, 4); }
  ctx.restore();
}
function drawScene(game, preview = false) {
  const p = game.player;
  const width = canvas.width;
  const camera = { x: clamp(p.x - width / 2, 0, WORLD.width - width), y: clamp(p.y - 300, 0, WORLD.height - 600) };
  ctx.clearRect(0, 0, width, 600);
  ctx.fillStyle = '#536b4a'; ctx.fillRect(0, 0, width, 600);
  ctx.save(); ctx.translate(-camera.x, -camera.y);
  // A fixed world pattern keeps the terrain stable as the camera moves.
  for (let x = 0; x < WORLD.width; x += 80) for (let y = 0; y < WORLD.height; y += 80) {
    const n = ((x * 17 + y * 31) ^ (x * y)) >>> 0;
    const px = x + n % 51, py = y + (n >>> 5) % 52;
    ctx.fillStyle = n % 3 ? '#677c5260' : '#3a563a70';
    ctx.beginPath(); ctx.ellipse(px, py, 26 + n % 20, 10 + n % 8, n % 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a0a77a50'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 3, py - 6); ctx.moveTo(px, py); ctx.lineTo(px + 4, py - 8); ctx.stroke();
  }
  ctx.strokeStyle = '#b7a98280'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
  for (const gem of game.gems) {
    ctx.save(); ctx.translate(gem.x, gem.y); ctx.rotate(Math.PI / 4); ctx.shadowColor = '#e8d688'; ctx.shadowBlur = 12; ctx.fillStyle = '#e5cc74'; ctx.fillRect(-4, -4, 8, 8); ctx.restore();
  }
  for (const effect of game.effects) {
    ctx.save(); ctx.globalAlpha = effect.life / effect.maxLife;
    if (effect.type === 'sweep') { ctx.strokeStyle = '#f6df9c'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * .8, effect.angle - .9, effect.angle + .9); ctx.stroke(); }
    else { ctx.fillStyle = '#ec9d5366'; ctx.strokeStyle = '#f2cf7d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (1 - effect.life / effect.maxLife * .3), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  for (const enemy of game.enemies) {
    drawSoldier(enemy.x, enemy.y, enemy.boss ? 'boss' : enemy.elite ? 'elite' : 'soldier', enemy.x > p.x ? -1 : 1, enemy.hit > 0);
    if (enemy.boss || enemy.hp < enemy.maxHp) {
      ctx.fillStyle = '#1c251d'; ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 16, enemy.radius * 2, 4);
      ctx.fillStyle = enemy.boss ? '#dba65f' : '#bd6252'; ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 16, enemy.radius * 2 * enemy.hp / enemy.maxHp, 4);
    }
  }
  for (const projectile of game.projectiles) {
    ctx.save(); ctx.shadowColor = '#f3d37e'; ctx.shadowBlur = 12; circle(projectile.x, projectile.y, projectile.type === 'fire' ? 7 : 4, projectile.type === 'fire' ? '#f5ad5d' : '#f7e6ac'); ctx.restore();
  }
  if (!p.invulnerable || Math.floor(p.invulnerable * 12) % 2 === 0) drawSoldier(p.x, p.y, game.heroId, p.facing);
  if (preview) {
    const positions = [[-260,-130],[-180,105],[250,-70],[215,150],[-340,60],[330,105],[130,-180],[-40,200]];
    for (const [x, y] of positions) drawSoldier(p.x + x, p.y + y, 'soldier', x > 0 ? -1 : 1);
    ctx.strokeStyle = '#e4d59b99'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, 100, -.8, .8); ctx.stroke();
  }
  ctx.restore();
  const vignette = ctx.createRadialGradient(width / 2, 300, 170, width / 2, 300, 600);
  vignette.addColorStop(0, '#101a1000'); vignette.addColorStop(1, '#101a1099'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, 600);
}

function frame(timestamp) {
  if (!lastFrame) lastFrame = timestamp;
  const elapsed = Math.min((timestamp - lastFrame) / 1000, 0.1);
  lastFrame = timestamp;
  if (state && state.status === 'playing' && !paused) {
    accumulator += elapsed;
    while (accumulator >= STEP && state.status === 'playing') { stepGame(state, input); accumulator -= STEP; }
    updateHud();
  }
  if (state && state.status !== displayedStatus) {
    displayedStatus = state.status;
    if (state.status === 'levelup') showUpgrades();
    if (state.status === 'won' || state.status === 'lost') finishGame();
  }
  if (state) drawScene(state);
  requestAnimationFrame(frame);
}
showStart();
drawScene(createGame(selectedHero, 1), true);
new ResizeObserver(() => {
  const width = Math.round(canvas.clientWidth / canvas.clientHeight * 600);
  if (width > 0 && width !== canvas.width) {
    canvas.width = width;
    if (!state) drawScene(createGame(selectedHero, 1), true);
  }
}).observe(canvas);
requestAnimationFrame(frame);
