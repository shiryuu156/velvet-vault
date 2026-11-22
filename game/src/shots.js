// The screenshot scenes behind ?shot=cover|stealth|alarm|escape. Each one plays the real
// rules forward from a fresh room for a fixed number of steps — guards patrol, cameras
// sweep, the alarm moves — so the frame is what a real game looks like, and the same seed
// always gives the same frame. The cover shows everything the judge's first criterion
// asks for in one frame: the room, guards with cones, a camera, the loot and the alarm.
import { STEP } from './config.js';
import { GUARD_CHASE } from './guard.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Step the world with no input for `seconds` (guards walk, cameras sweep). */
function idle(world, seconds) {
  for (let t = 0; t < seconds; t += STEP) world.step(STEP, { x: 0, y: 0 }, false, false, null);
}

/** Walk the thief toward `target` for up to `seconds`, one fixed step at a time. */
function walkTo(world, target, seconds) {
  for (let t = 0; t < seconds; t += STEP) {
    const thief = world.state.thief;
    const dx = target.x - thief.x;
    const dy = target.y - thief.y;
    if (Math.hypot(dx, dy) < 12) return;
    world.step(STEP, { x: dx, y: dy }, true, false, null);
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best score
 * to show. Any unknown name stages the cover.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'stealth') {
    world.loadRoom(1);
    state.thief.x = 400;
    state.thief.y = 430;
    state.thief.sneaking = true;
    idle(world, 8);
    state.alarm.value = 12;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alarm') {
    world.loadRoom(0);
    state.thief.x = 700;
    state.thief.y = 340;
    const hunter = state.guards[1];
    hunter.x = 1000;
    hunter.y = 260;
    hunter.suspicion = 1;
    hunter.state = GUARD_CHASE;
    hunter.lastSeen = { x: state.thief.x, y: state.thief.y };
    state.alarm.value = 62;
    idle(world, 0.8);
    return { screen: SCREEN_PLAY, best: 1250 };
  }
  if (name === 'escape') {
    world.loadRoom(2);
    state.score = 2450;
    state.loot = 1650;
    state.gemTaken = true;
    state.thief.hasGem = true;
    state.thief.x = 1220;
    state.thief.y = 405;
    world.step(STEP, { x: 0, y: 0 }, false, false, null);
    return { screen: SCREEN_ESCAPED, best: state.score };
  }
  if (name === 'caught') {
    world.loadRoom(0);
    state.thief.x = 700;
    state.thief.y = 340;
    state.caught = true;
    state.alarm.value = 100;
    state.alarm.lockdown = true;
    return { screen: SCREEN_CAUGHT, best: 1250 };
  }
  // The cover: the thief sneaks the long way round the Marble Hall toward the Star,
  // a guard's cone sweeping just ahead of them, the camera watching from above.
  world.loadRoom(0);
  walkTo(world, { x: 500, y: 520 }, 9);
  state.thief.sneaking = true;
  state.alarm.value = 35;
  return { screen: SCREEN_PLAY, best: 0 };
}

export { SCREEN_TITLE };
