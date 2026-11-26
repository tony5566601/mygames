import test from 'node:test';
import assert from 'node:assert/strict';
import './simulation.js';

const { createGame, stepGame, chooseUpgrade, STEP, DURATION, WORLD } = globalThis.ThreeKingdomsSimulation;

test('same seed and inputs produce the same serializable state', () => {
  const a = createGame('guanyu', 123);
  const b = createGame('guanyu', 123);
  for (let i = 0; i < 600; i++) {
    const input = { right: i < 300, down: i >= 300 };
    stepGame(a, input); stepGame(b, input);
  }
  assert.deepEqual(a, b);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
});

test('movement is normalized and remains within the world', () => {
  const game = createGame('zhaoyun', 1);
  const start = { ...game.player };
  stepGame(game, { up: true, right: true });
  assert.ok(Math.abs(Math.hypot(game.player.x - start.x, game.player.y - start.y) - start.speed * STEP) < 1e-8);
  game.player.x = WORLD.width - 18;
  stepGame(game, { right: true });
  assert.equal(game.player.x, WORLD.width - 18);
});

test('collecting experience pauses for a valid upgrade and carries overflow', () => {
  const game = createGame('guanyu', 1);
  game.gems.push({ x: game.player.x, y: game.player.y, value: 14 });
  stepGame(game, {});
  assert.equal(game.status, 'levelup');
  assert.equal(game.player.level, 2);
  assert.equal(game.upgrades.length, 3);
  assert.equal(chooseUpgrade(game, 'not-offered'), false);
  assert.equal(chooseUpgrade(game, game.upgrades[0]), true);
  assert.equal(game.status, 'levelup');
  assert.equal(game.player.level, 3);
  assert.equal(game.player.xp, 1);
  assert.equal(chooseUpgrade(game, game.upgrades[0]), true);
  assert.equal(game.status, 'playing');
});

test('boss arrives at two minutes and surviving three minutes wins', () => {
  const game = createGame('guanyu', 5);
  game.time = 120 - STEP / 2;
  stepGame(game, {});
  assert.equal(game.bossSpawned, true);
  assert.equal(game.enemies.filter(enemy => enemy.boss).length, 1);
  game.time = DURATION - STEP / 2;
  stepGame(game, {});
  assert.equal(game.status, 'won');
  const time = game.time;
  stepGame(game, {});
  assert.equal(game.time, time);
});

test('contact can end a run and stopped games do not advance', () => {
  const game = createGame('guanyu', 1);
  game.player.hp = 1;
  game.player.cooldown = 1;
  game.enemies.push({ x: game.player.x, y: game.player.y, hp: 100, maxHp: 100, radius: 13, speed: 0, damage: 10, hit: 0 });
  stepGame(game, {});
  assert.equal(game.status, 'lost');
  assert.equal(game.player.hp, 0);
  const time = game.time;
  stepGame(game, {});
  assert.equal(game.time, time);
});

test('heroes deal damage with their distinct attacks', () => {
  for (const hero of ['guanyu', 'zhaoyun', 'zhugeliang']) {
    const game = createGame(hero, 1);
    game.spawnTimer = 100;
    const enemy = { x: game.player.x + 60, y: game.player.y, hp: 10, maxHp: 10, radius: 13, speed: 0, damage: 0, hit: 0 };
    game.enemies.push(enemy);
    for (let i = 0; i < 30; i++) stepGame(game, {});
    assert.equal(game.kills, 1, `${hero} should defeat an enemy in range`);
    assert.equal(game.gems.length + game.player.xp, 1);
  }
});
