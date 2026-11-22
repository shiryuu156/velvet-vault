// A patrolling guard: walks a waypoint loop, pauses, looks where it walks, and its
// suspicion fills when the thief is inside its vision cone with a clear line of sight.
// Suspicion past 0.4 makes it walk toward the last thing it saw; at 1 it chases.
import { FORGET_RATE, SPOT_RATE, SPOT_RATE_CLOSE, SPOT_RATE_SHADOW, SPOT_RATE_SNEAK } from './config.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_RETURN = 'return';

const CHASE_SPEED = 215;
const SUSPICIOUS_SPEED = 130;
const CATCH_RADIUS = 24;
const CLOSE_RANGE = 90;

/** Angle difference wrapped to [-PI, PI]. */
export function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Is `point` inside the cone from `origin` facing `angle` with `range` and `halfAngle`? */
export function inCone(origin, angle, range, halfAngle, point) {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  return Math.abs(angleDelta(Math.atan2(dy, dx), angle)) <= halfAngle;
}

export function createGuard(spec) {
  const [sx, sy] = spec.waypoints[0];
  return {
    x: sx,
    y: sy,
    angle: 0,
    waypoint: 1 % spec.waypoints.length,
    pause: 0,
    suspicion: 0,
    state: GUARD_PATROL,
    lastSeen: null,
    investigate: null,
    spec,
  };
}

/**
 * Move the guard one step. `see` tells whether the thief is visible right now and how
 * exposed they are (1 = walking in the open, less when sneaking or in shadow); `thief`
 * is the thief's position; `blocked` tests line of sight for a move target.
 */
export function stepGuard(guard, dt, see, thief, random) {
  const { spec } = guard;
  if (see.visible) {
    const rate = see.exposure * (see.close ? SPOT_RATE_CLOSE : SPOT_RATE);
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
    guard.lastSeen = { x: thief.x, y: thief.y };
    if (guard.suspicion >= 1) guard.state = GUARD_CHASE;
    else if (guard.suspicion >= 0.4 && guard.state === GUARD_PATROL) guard.state = GUARD_SUSPICIOUS;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - FORGET_RATE * dt);
    if (guard.state === GUARD_CHASE && guard.suspicion <= 0.25) guard.state = GUARD_RETURN;
    if (guard.state === GUARD_SUSPICIOUS && guard.suspicion <= 0.05) guard.state = GUARD_RETURN;
  }

  let target = null;
  let speed = spec.speed;
  if (guard.state === GUARD_CHASE) {
    target = guard.lastSeen;
    speed = CHASE_SPEED;
  } else if (guard.state === GUARD_INVESTIGATE && guard.investigate) {
    target = guard.investigate;
    speed = SUSPICIOUS_SPEED;
  } else if (guard.state === GUARD_SUSPICIOUS && guard.lastSeen) {
    target = guard.lastSeen;
    speed = SUSPICIOUS_SPEED;
  } else if (guard.state === GUARD_RETURN) {
    const [wx, wy] = spec.waypoints[guard.waypoint];
    target = { x: wx, y: wy };
  } else {
    const [wx, wy] = spec.waypoints[guard.waypoint];
    target = { x: wx, y: wy };
  }

  if (guard.pause > 0) {
    guard.pause -= dt;
    return;
  }
  if (!target) return;
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    if (guard.state === GUARD_PATROL || guard.state === GUARD_RETURN) {
      guard.waypoint = (guard.waypoint + 1) % spec.waypoints.length;
      guard.pause = spec.pause * random.range(0.7, 1.3);
      if (guard.state === GUARD_RETURN) guard.state = GUARD_PATROL;
    } else if (guard.state === GUARD_INVESTIGATE) {
      guard.investigate = null;
      guard.state = GUARD_RETURN;
      guard.pause = 0.8;
    } else {
      guard.state = GUARD_RETURN;
    }
    return;
  }
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
}

/** How exposed the thief is to this guard: 0 when outside the cone or behind cover. */
export function guardSees(guard, thief, sneaking, inShadow, hasLineOfSight) {
  const origin = { x: guard.x, y: guard.y };
  if (!inCone(origin, guard.angle, guard.spec.range, guard.spec.halfAngle, thief)) {
    return { visible: false, exposure: 0, close: false };
  }
  if (!hasLineOfSight(origin, thief)) return { visible: false, exposure: 0, close: false };
  let exposure = 1;
  if (sneaking) exposure = SPOT_RATE_SNEAK / SPOT_RATE;
  if (inShadow) exposure *= SPOT_RATE_SHADOW;
  const close = Math.hypot(thief.x - guard.x, thief.y - guard.y) < CLOSE_RANGE;
  return { visible: true, exposure, close };
}

export function guardCatches(guard, thief) {
  return Math.hypot(thief.x - guard.x, thief.y - guard.y) < CATCH_RADIUS;
}
