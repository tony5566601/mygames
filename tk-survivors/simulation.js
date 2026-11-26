// The simulation only consumes state, player input and a fixed time step.
(() => {
const STEP = 1 / 60;
const DURATION = 180;
const WORLD = { width: 2400, height: 1800 };
const HEROES = {
  guanyu: { name: '關羽', title: '武聖', maxHp: 140, speed: 175, damage: 30, interval: 0.8, range: 125, attack: 'sweep' },
  zhaoyun: { name: '趙雲', title: '常勝將軍', maxHp: 100, speed: 205, damage: 22, interval: 0.48, range: 390, attack: 'spear' },
  zhugeliang: { name: '諸葛亮', title: '臥龍', maxHp: 90, speed: 165, damage: 25, interval: 1.15, range: 320, attack: 'fire' }
};

const UPGRADES = {
  damage: { name: '驍勇善戰', description: '攻擊傷害提升 25%', icon: '⚔' },
  speed: { name: '神行百步', description: '移動速度提升 12%', icon: '➤' },
  attack: { name: '兵貴神速', description: '攻擊間隔縮短 15%', icon: '✦' },
  vitality: { name: '固本培元', description: '生命上限提升 25，並恢復 25 生命', icon: '✚' },
  recovery: { name: '軍醫妙手', description: '恢復 45% 生命', icon: '❖' },
  reach: { name: '長驅直入', description: '攻擊範圍提升 18%', icon: '◎' }
};

function random(state) {
  state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
  return state.rng / 4294967296;
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const xpNeeded = level => 5 + (level - 1) * 3;

function createGame(heroId, seed = Date.now()) {
  const hero = HEROES[heroId];
  if (!hero) throw new Error(`Unknown hero: ${heroId}`);
  return {
    rng: seed >>> 0, time: 0, status: 'playing', heroId, kills: 0,
    player: { x: WORLD.width / 2, y: WORLD.height / 2, hp: hero.maxHp, maxHp: hero.maxHp, speed: hero.speed, damage: hero.damage, interval: hero.interval, range: hero.range, attack: hero.attack, cooldown: 0, invulnerable: 0, level: 1, xp: 0, facing: 1 },
    enemies: [], gems: [], projectiles: [], effects: [], spawnTimer: 0.5,
    bossSpawned: false, upgrades: [], nextId: 1
  };
}

function spawnEnemy(state, boss = false) {
  const angle = random(state) * Math.PI * 2;
  const radius = 520 + random(state) * 150;
  const x = clamp(state.player.x + Math.cos(angle) * radius, 20, WORLD.width - 20);
  const y = clamp(state.player.y + Math.sin(angle) * radius, 20, WORLD.height - 20);
  const elite = !boss && state.time > 45 && random(state) < Math.min(0.23, state.time / 800);
  const hp = boss ? 750 : elite ? 95 + state.time * 0.25 : 35 + state.time * 0.14;
  state.enemies.push({ id: state.nextId++, x, y, hp, maxHp: hp, radius: boss ? 28 : elite ? 18 : 13, speed: boss ? 65 : elite ? 77 : 56 + random(state) * 22, damage: boss ? 27 : elite ? 18 : 10, boss, elite, hit: 0 });
}

function hurtEnemy(state, enemy, damage) {
  enemy.hp -= damage;
  enemy.hit = 0.12;
  if (enemy.hp <= 0 && !enemy.dead) {
    enemy.dead = true;
    state.kills++;
    state.gems.push({ x: enemy.x, y: enemy.y, value: enemy.boss ? 15 : enemy.elite ? 3 : 1 });
  }
}

function attack(state) {
  const p = state.player;
  const targets = state.enemies.filter(e => !e.dead && distance(p, e) <= p.range + e.radius).sort((a, b) => distance(p, a) - distance(p, b));
  if (!targets.length) return;
  const target = targets[0];
  p.facing = target.x < p.x ? -1 : 1;
  p.cooldown = p.interval;
  if (p.attack === 'sweep') {
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    for (const enemy of targets) {
      const diff = Math.atan2(Math.sin(Math.atan2(enemy.y - p.y, enemy.x - p.x) - angle), Math.cos(Math.atan2(enemy.y - p.y, enemy.x - p.x) - angle));
      if (Math.abs(diff) < 0.95) hurtEnemy(state, enemy, p.damage);
    }
    state.effects.push({ type: 'sweep', x: p.x, y: p.y, angle, radius: p.range, life: 0.22, maxLife: 0.22 });
  } else {
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    state.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 430, vy: Math.sin(angle) * 430, life: p.range / 430, damage: p.damage, type: p.attack });
  }
}

function offerUpgrades(state) {
  const options = Object.keys(UPGRADES);
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  state.upgrades = options.slice(0, 3);
  state.status = 'levelup';
}

function chooseUpgrade(state, id) {
  if (state.status !== 'levelup' || !state.upgrades.includes(id)) return false;
  const p = state.player;
  if (id === 'damage') p.damage *= 1.25;
  if (id === 'speed') p.speed *= 1.12;
  if (id === 'attack') p.interval *= 0.85;
  if (id === 'vitality') { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); }
  if (id === 'recovery') p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.45);
  if (id === 'reach') p.range *= 1.18;
  state.upgrades = [];
  state.status = 'playing';
  if (p.xp >= xpNeeded(p.level)) {
    p.xp -= xpNeeded(p.level);
    p.level++;
    offerUpgrades(state);
  }
  return true;
}

function stepGame(state, input, dt = STEP) {
  if (state.status !== 'playing') return;
  if (!Number.isFinite(dt) || dt <= 0 || dt > STEP) throw new Error('Invalid simulation step');
  const p = state.player;
  state.time += dt;
  const dx = Number(Boolean(input.right)) - Number(Boolean(input.left));
  const dy = Number(Boolean(input.down)) - Number(Boolean(input.up));
  const length = Math.hypot(dx, dy) || 1;
  p.x = clamp(p.x + dx / length * p.speed * dt, 18, WORLD.width - 18);
  p.y = clamp(p.y + dy / length * p.speed * dt, 18, WORLD.height - 18);
  if (dx) p.facing = dx;
  p.cooldown -= dt;
  p.invulnerable = Math.max(0, p.invulnerable - dt);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.enemies.length < 110) {
    const count = 1 + Math.floor(state.time / 55);
    for (let i = 0; i < count && state.enemies.length < 110; i++) spawnEnemy(state);
    state.spawnTimer = Math.max(0.25, 0.95 - state.time / 300);
  }
  if (state.time >= 120 && !state.bossSpawned) { spawnEnemy(state, true); state.bossSpawned = true; }
  if (p.cooldown <= 0) attack(state);

  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    enemy.hit = Math.max(0, enemy.hit - dt);
    const dist = distance(p, enemy);
    if (dist > 0) {
      enemy.x += (p.x - enemy.x) / dist * enemy.speed * dt;
      enemy.y += (p.y - enemy.y) / dist * enemy.speed * dt;
    }
    if (dist < enemy.radius + 15 && p.invulnerable <= 0) {
      p.hp = Math.max(0, p.hp - enemy.damage);
      p.invulnerable = 0.65;
    }
  }
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    for (const enemy of state.enemies) {
      if (!enemy.dead && distance(projectile, enemy) < enemy.radius + 8) {
        if (projectile.type === 'fire') {
          for (const other of state.enemies) if (!other.dead && distance(projectile, other) < 90 + other.radius) hurtEnemy(state, other, projectile.damage);
          state.effects.push({ type: 'fire', x: projectile.x, y: projectile.y, radius: 90, life: 0.3, maxLife: 0.3 });
        } else {
          hurtEnemy(state, enemy, projectile.damage);
        }
        projectile.life = 0;
        break;
      }
    }
  }
  state.enemies = state.enemies.filter(e => !e.dead);
  state.projectiles = state.projectiles.filter(projectile => projectile.life > 0);
  for (const effect of state.effects) effect.life -= dt;
  state.effects = state.effects.filter(effect => effect.life > 0);
  for (const gem of state.gems) {
    const dist = distance(p, gem);
    if (dist < 85 && dist > 0) {
      const move = Math.min(dist, 260 * dt);
      gem.x += (p.x - gem.x) / dist * move;
      gem.y += (p.y - gem.y) / dist * move;
    }
    if (distance(p, gem) < 18) { p.xp += gem.value; gem.collected = true; }
  }
  state.gems = state.gems.filter(gem => !gem.collected);
  if (p.hp <= 0) state.status = 'lost';
  else if (state.time >= DURATION) state.status = 'won';
  else if (p.xp >= xpNeeded(p.level)) {
    p.xp -= xpNeeded(p.level);
    p.level++;
    offerUpgrades(state);
  }
}

function experienceNeeded(level) { return xpNeeded(level); }

globalThis.ThreeKingdomsSimulation = { createGame, stepGame, chooseUpgrade, experienceNeeded, HEROES, UPGRADES, STEP, DURATION, WORLD };
})();
