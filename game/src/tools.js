// The three tools, each paid for in charges: a noise coin that pulls a guard off its
// patrol, a smoke puff that hides the thief for a few seconds, and an EMP burst that
// switches every camera off. A tool spent is gone until a kit refills it.
import { TOOLS } from './config.js';

export function createToolField() {
  return {
    coins: [], // { x, y, ttl } — a landed coin guards walk toward while it rings.
    smokes: [], // { x, y, ttl } — a cloud the thief can hide inside.
    empUntil: 0, // game time until which cameras stay dark.
  };
}

/** Throw a coin toward `point` (clamped to throw range); it rings for 3 seconds. */
export function throwCoin(field, from, point, now) {
  const dx = point.x - from.x;
  const dy = point.y - from.y;
  const dist = Math.hypot(dx, dy);
  const range = Math.min(dist, TOOLS.coin.throwRange);
  const at = dist === 0 ? { x: from.x + 40, y: from.y } : { x: from.x + (dx / dist) * range, y: from.y + (dy / dist) * range };
  field.coins.push({ x: at.x, y: at.y, ttl: 3 });
  return at;
}

/** Drop a smoke puff at the thief's feet. */
export function dropSmoke(field, at) {
  field.smokes.push({ x: at.x, y: at.y, ttl: TOOLS.smoke.seconds });
}

/** Fire the EMP: every camera goes dark until `now + seconds`. */
export function fireEmp(field, now) {
  field.empUntil = now + TOOLS.emp.seconds;
}

export function empActive(field, now) {
  return now < field.empUntil;
}

/** Is `point` inside any live smoke cloud? */
export function inSmoke(field, point) {
  return field.smokes.some((s) => Math.hypot(point.x - s.x, point.y - s.y) < TOOLS.smoke.radius);
}

/** Age the coins and clouds; expired ones vanish. */
export function stepTools(field, dt) {
  for (const coin of field.coins) coin.ttl -= dt;
  for (const smoke of field.smokes) smoke.ttl -= dt;
  field.coins = field.coins.filter((c) => c.ttl > 0);
  field.smokes = field.smokes.filter((s) => s.ttl > 0);
}
