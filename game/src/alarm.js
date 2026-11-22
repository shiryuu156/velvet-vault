// The alarm meter, 0..100: it climbs while anyone sees the thief, faster while a guard
// chases, and falls back when the thief is hidden. At 100 the gallery locks down — every
// guard sprints for the thief — but hiding still bleeds it down, so a lockdown is a
// warning, not an instant loss.
import { ALARM } from './config.js';

export function createAlarm() {
  return { value: 0, peak: 0, lockdown: false };
}

/** One step of the meter. `seen` is how hot the moment is: none, seen, chase or camera. */
export function stepAlarm(alarm, dt, heat) {
  let rate = 0;
  if (heat === 'chase') rate = ALARM.chaseRate;
  else if (heat === 'camera') rate = ALARM.cameraRate;
  else if (heat === 'seen') rate = ALARM.seenRate;
  else rate = alarm.lockdown ? -ALARM.lockdownDecay : -ALARM.decayRate;
  alarm.value = Math.max(0, Math.min(ALARM.lockdownAt, alarm.value + rate * dt));
  alarm.peak = Math.max(alarm.peak, alarm.value);
  alarm.lockdown = alarm.value >= ALARM.lockdownAt;
}

export function alarmBand(alarm) {
  if (alarm.value >= ALARM.dangerAt) return 'danger';
  if (alarm.value >= ALARM.warnAt) return 'warn';
  return 'calm';
}
