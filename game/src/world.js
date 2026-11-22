// The heist itself: the rooms, the thief, the guards, the cameras, the alarm and the
// score, with no drawing and no browser in it. step() advances one fixed step and returns
// what happened as bit flags, so the caller can react without the world knowing about
// screens or sound.
import { ALARM, SCORE, STEP, THIEF, TOOLS, VIEW } from './config.js';
import { LEVELS } from './levels.js';
import { createGuard, guardCatches, guardSees, stepGuard, GUARD_CHASE, GUARD_INVESTIGATE } from './guard.js';
import { cameraSees, createCamera, stepCamera } from './camera.js';
import { createThief, moveThief, refillCharges, spendCharge } from './thief.js';
import { createAlarm, stepAlarm } from './alarm.js';
import { createToolField, dropSmoke, empActive, fireEmp, inSmoke, stepTools, throwCoin } from './tools.js';

export const EVENT_PICKUP = 1;
export const EVENT_GEM = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_ROOM_DONE = 16;
export const EVENT_TOOL = 32;
export const EVENT_SPOTTED = 64;

function inRect(point, rect, pad = 0) {
  return point.x >= rect.x - pad && point.x <= rect.x + rect.w + pad && point.y >= rect.y - pad && point.y <= rect.y + rect.h + pad;
}

function circleHitsRect(x, y, radius, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy) < radius;
}

export function createWorld(random) {
  const state = {
    roomIndex: 0,
    level: null,
    thief: null,
    guards: [],
    cameras: [],
    alarm: createAlarm(),
    tools: createToolField(),
    score: 0,
    loot: 0,
    elapsed: 0,
    roomElapsed: 0,
    ghost: true,
    gemTaken: false,
    escaped: false,
    caught: false,
    message: '',
    messageUntil: 0,
  };

  function loadRoom(index) {
    const def = LEVELS[index];
    state.roomIndex = index;
    state.level = {
      ...def,
      trinkets: def.trinkets.map((t) => ({ ...t })),
      kits: def.kits.map((k) => ({ ...k })),
    };
    state.thief = createThief(def.spawn);
    state.thief.charges = state.savedCharges ?? { coin: TOOLS.coin.start, smoke: TOOLS.smoke.start, emp: TOOLS.emp.start };
    state.guards = def.guards.map(createGuard);
    state.cameras = def.cameras.map(createCamera);
    state.alarm = createAlarm();
    state.tools = createToolField();
    state.gemTaken = false;
    state.roomElapsed = 0;
    state.ghost = true;
    state.message = def.brief;
    state.messageUntil = state.elapsed + 4;
  }

  function reset() {
    state.score = 0;
    state.loot = 0;
    state.elapsed = 0;
    state.escaped = false;
    state.caught = false;
    state.savedCharges = undefined;
    loadRoom(0);
  }

  function solidAt(x, y) {
    if (x < 0 || x > VIEW.width || y < 0 || y > VIEW.height) return true;
    for (const wall of state.level.walls) if (inRect({ x, y }, wall)) return true;
    for (const c of state.level.cover) if (circleHitsRect(x, y, THIEF.radius, c)) return true;
    return false;
  }

  /** Does a straight line from `a` to `b` cross any wall or cover? Sampled every 8px. */
  function hasLineOfSight(a, b) {
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 1; i < steps; i += 1) {
      const x = a.x + ((b.x - a.x) * i) / steps;
      const y = a.y + ((b.y - a.y) * i) / steps;
      for (const wall of state.level.walls) if (inRect({ x, y }, wall)) return false;
      for (const c of state.level.cover) if (inRect({ x, y }, c)) return false;
    }
    return true;
  }

  function thiefInShadow() {
    return state.level.shadows.some((s) => inRect(state.thief, s));
  }

  /** Advance one fixed step. `move` is {x, y} (-1..1 each); `sneak`/`sprint` are held keys. */
  function step(dt, move, sneak, sprint, toolUse) {
    if (state.caught || state.escaped) return 0;
    let events = 0;
    state.elapsed += dt;
    state.roomElapsed += dt;

    moveThief(state.thief, move, dt, sneak, sprint, (x, y) => solidAt(x, y));

    // Tools, spent on the player's say-so.
    if (toolUse) {
      if (toolUse.kind === 'coin' && spendCharge(state.thief, 'coin')) {
        throwCoin(state.tools, state.thief, toolUse.at, state.elapsed);
        events |= EVENT_TOOL;
      } else if (toolUse.kind === 'smoke' && spendCharge(state.thief, 'smoke')) {
        dropSmoke(state.tools, state.thief);
        events |= EVENT_TOOL;
      } else if (toolUse.kind === 'emp' && spendCharge(state.thief, 'emp')) {
        fireEmp(state.tools, state.elapsed);
        events |= EVENT_TOOL;
      }
    }
    stepTools(state.tools, dt);

    const hidden = inSmoke(state.tools, state.thief);
    const shadow = thiefInShadow();

    // Guards see, suspect, chase; a ringing coin pulls the nearest ones off patrol.
    let heat = 'none';
    let anyChase = false;
    for (const guard of state.guards) {
      for (const coin of state.tools.coins) {
        if (guard.state !== GUARD_CHASE && Math.hypot(coin.x - guard.x, coin.y - guard.y) < TOOLS.coin.hearRadius) {
          guard.state = GUARD_INVESTIGATE;
          guard.investigate = { x: coin.x, y: coin.y };
        }
      }
      const see = hidden
        ? { visible: false, exposure: 0, close: false }
        : guardSees(guard, state.thief, state.thief.sneaking, shadow, hasLineOfSight);
      if (see.visible) {
        heat = 'seen';
        if (guard.suspicion >= 0.4) events |= EVENT_SPOTTED;
      }
      stepGuard(guard, dt, see, state.thief, random);
      if (guard.state === GUARD_CHASE) {
        anyChase = true;
        heat = 'chase';
      }
      if (guard.state === GUARD_CHASE && guardCatches(guard, state.thief)) {
        state.caught = true;
        return events | EVENT_CAUGHT;
      }
    }

    // Cameras sweep; while one watches, the alarm climbs and guards get curious.
    for (const camera of state.cameras) {
      stepCamera(camera, dt);
      if (empActive(state.tools, state.elapsed)) camera.disabled = Math.max(camera.disabled, 0.5);
      if (!hidden && cameraSees(camera, state.thief, hasLineOfSight)) {
        if (heat === 'none') heat = 'camera';
        for (const guard of state.guards) {
          if (guard.state !== GUARD_CHASE && guard.suspicion < 0.4) {
            guard.suspicion = Math.min(0.55, guard.suspicion + 0.5 * dt);
            guard.lastSeen = { x: state.thief.x, y: state.thief.y };
          }
        }
      }
    }
    if (anyChase) heat = 'chase';
    stepAlarm(state.alarm, dt, heat);
    if (state.alarm.peak > 25) state.ghost = false;

    // Lockdown: every guard sprints for the last place the thief was seen.
    if (state.alarm.lockdown) {
      for (const guard of state.guards) {
        if (guard.state !== GUARD_CHASE) {
          guard.state = GUARD_CHASE;
          guard.suspicion = 1;
          guard.lastSeen = guard.lastSeen ?? { x: state.thief.x, y: state.thief.y };
        }
      }
    }

    // Pickups: trinkets, tool kits, and the gem itself.
    const thief = state.thief;
    for (const trinket of state.level.trinkets) {
      if (!trinket.taken && Math.hypot(trinket.x - thief.x, trinket.y - thief.y) < THIEF.grabRange) {
        trinket.taken = true;
        state.score += SCORE.trinket;
        state.loot += SCORE.trinket;
        events |= EVENT_PICKUP;
      }
    }
    for (const kit of state.level.kits) {
      if (!kit.taken && Math.hypot(kit.x - thief.x, kit.y - thief.y) < THIEF.grabRange) {
        kit.taken = true;
        refillCharges(thief);
        state.score += SCORE.kit;
        events |= EVENT_PICKUP;
      }
    }
    const gem = state.level.gem;
    if (!state.gemTaken && Math.hypot(gem.x - thief.x, gem.y - thief.y) < THIEF.grabRange + 6) {
      state.gemTaken = true;
      thief.hasGem = true;
      state.score += SCORE.gem;
      state.loot += SCORE.gem;
      state.message = 'The Argent Star is yours. Get out the east door!';
      state.messageUntil = state.elapsed + 4;
      events |= EVENT_GEM;
    }

    // The exit: only open once the gem is taken.
    if (state.gemTaken && inRect(thief, state.level.exit)) {
      const timeBonus = Math.max(0, Math.round((300 - state.roomElapsed) * SCORE.timeBonusPerSecond));
      state.score += timeBonus;
      if (state.ghost) state.score += SCORE.ghostBonus;
      state.savedCharges = { ...thief.charges };
      if (state.roomIndex + 1 >= LEVELS.length) {
        state.escaped = true;
        return events | EVENT_ESCAPED;
      }
      loadRoom(state.roomIndex + 1);
      return events | EVENT_ROOM_DONE;
    }
    return events;
  }

  reset();
  return { state, reset, loadRoom, step, solidAt, hasLineOfSight, thiefInShadow };
}
