// The thief: Wren. Moves with the keys, sneaks on Shift (slow, hard to spot), and sprints
// with a held mouse button or Space when the getaway matters. Carries the tools and the gem.
import { THIEF } from './config.js';

export function createThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    facing: 0,
    sneaking: false,
    sprinting: false,
    hasGem: false,
    charges: { coin: 3, smoke: 2, emp: 1 },
  };
}

/** Move toward `dir` (a unit vector, or zero) and remember which way Wren faces. */
export function moveThief(thief, dir, dt, sneaking, sprinting, collide) {
  thief.sneaking = sneaking;
  thief.sprinting = sprinting && !sneaking;
  const speed = sneaking ? THIEF.sneakSpeed : thief.sprinting ? THIEF.sprintSpeed : THIEF.walkSpeed;
  if (dir.x === 0 && dir.y === 0) return;
  const len = Math.hypot(dir.x, dir.y);
  const nx = thief.x + (dir.x / len) * speed * dt;
  const ny = thief.y + (dir.y / len) * speed * dt;
  thief.facing = Math.atan2(dir.y, dir.x);
  // Move one axis at a time so a wall never wedges the thief in a corner.
  if (!collide(nx, thief.y)) thief.x = nx;
  if (!collide(thief.x, ny)) thief.y = ny;
}

/** Spend one charge of a tool; false when the pouch is empty. */
export function spendCharge(thief, tool) {
  if (thief.charges[tool] <= 0) return false;
  thief.charges[tool] -= 1;
  return true;
}

/** A tool kit refills one charge of each tool. */
export function refillCharges(thief) {
  thief.charges.coin += 1;
  thief.charges.smoke += 1;
  thief.charges.emp += 1;
}
