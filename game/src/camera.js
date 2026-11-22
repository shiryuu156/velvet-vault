// A wall-mounted security camera: its cone sweeps a fixed arc on a timer, and while the
// thief stands in it the alarm climbs. An EMP burst switches it off for a few seconds,
// shown by a grey cone and a blinking "OFF" lamp.
import { inCone } from './guard.js';

export function createCamera(spec) {
  return {
    x: spec.x,
    y: spec.y,
    angle: spec.arc[0],
    disabled: 0,
    time: 0,
    spec,
  };
}

/** Sweep the cone back and forth across the arc; count down any EMP disable. */
export function stepCamera(camera, dt) {
  camera.time += dt;
  if (camera.disabled > 0) camera.disabled = Math.max(0, camera.disabled - dt);
  const [lo, hi] = camera.spec.arc;
  const span = hi - lo;
  const phase = (camera.time % camera.spec.sweepSeconds) / camera.spec.sweepSeconds;
  const sweep = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  camera.angle = lo + span * sweep;
}

/** Does this camera see the thief right now (and is it switched on)? */
export function cameraSees(camera, thief, hasLineOfSight) {
  if (camera.disabled > 0) return false;
  const origin = { x: camera.x, y: camera.y };
  if (!inCone(origin, camera.angle, camera.spec.range, camera.spec.halfAngle, thief)) return false;
  return hasLineOfSight(origin, thief);
}
