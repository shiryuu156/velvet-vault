// Original sounds, synthesised with the Web Audio oscillator — no audio files, no
// network. A soft chime for loot, a low alarm swell while the meter climbs, a sting
// for being caught, a bright run for the getaway. Silent until the first key press,
// as browsers require, and a no-op where audio is unavailable.
export function createAudio() {
  let ctx = null;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    } catch {
      return null;
    }
    return ctx;
  }

  function blip(freq, seconds, type, volume, when = 0) {
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    pickup() {
      blip(880, 0.18, 'sine', 0.12);
      blip(1320, 0.22, 'sine', 0.08, 0.07);
    },
    gem() {
      blip(660, 0.2, 'triangle', 0.14);
      blip(880, 0.2, 'triangle', 0.14, 0.09);
      blip(1320, 0.35, 'triangle', 0.14, 0.18);
    },
    tool() {
      blip(520, 0.12, 'square', 0.05);
    },
    spotted() {
      blip(220, 0.25, 'sawtooth', 0.08);
    },
    caught() {
      blip(180, 0.5, 'sawtooth', 0.14);
      blip(120, 0.7, 'sawtooth', 0.14, 0.15);
    },
    escaped() {
      blip(523, 0.2, 'triangle', 0.12);
      blip(659, 0.2, 'triangle', 0.12, 0.12);
      blip(784, 0.2, 'triangle', 0.12, 0.24);
      blip(1046, 0.45, 'triangle', 0.12, 0.36);
    },
    /** The alarm hum follows the meter: quiet below 40, swelling above it. */
    alarmLevel(level) {
      const ac = ensure();
      if (!ac) return;
      if (level <= 0.05) {
        if (alarmOsc) {
          alarmOsc.stop();
          alarmOsc = null;
          alarmGain = null;
        }
        return;
      }
      if (!alarmOsc) {
        alarmOsc = ac.createOscillator();
        alarmGain = ac.createGain();
        alarmOsc.type = 'sine';
        alarmOsc.frequency.value = 110;
        alarmGain.gain.value = 0;
        alarmOsc.connect(alarmGain);
        alarmGain.connect(ac.destination);
        alarmOsc.start();
      }
      alarmGain.gain.setTargetAtTime(level * 0.05, ac.currentTime, 0.2);
      alarmOsc.frequency.setTargetAtTime(110 + level * 60, ac.currentTime, 0.2);
    },
  };
}
