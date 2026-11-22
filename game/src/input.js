// Keyboard and mouse. Held keys steer the thief; one-shot presses (start, pause, tools)
// are queued as bit flags and taken once by the loop, so a press between two frames is
// never lost and never counted twice. The mouse aims the noise coin.
import { VIEW } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_COIN = 4;
export const ACTION_SMOKE = 8;
export const ACTION_EMP = 16;
export const ACTION_CLICK = 32;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  const held = { up: false, down: false, left: false, right: false, sneak: false, sprint: false };
  let actions = 0;
  let mouse = { x: VIEW.width / 2, y: VIEW.height / 2 };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = true;
    else if (event.code === 'KeyQ') {
      if (!event.repeat) actions |= ACTION_COIN;
    } else if (event.code === 'KeyE') {
      if (!event.repeat) actions |= ACTION_SMOKE;
    } else if (event.code === 'KeyR') {
      if (!event.repeat) actions |= ACTION_EMP;
    } else if (CONFIRM.has(event.code)) {
      if (event.repeat) return;
      actions |= ACTION_CONFIRM;
      held.sprint = true;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
    else if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = false;
    else if (event.code === 'Space') held.sprint = false;
  });
  window.addEventListener('blur', () => {
    held.up = held.down = held.left = held.right = held.sneak = held.sprint = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    mouse = toLogical(event);
  });
  canvas.addEventListener('pointerdown', (event) => {
    mouse = toLogical(event);
    actions |= ACTION_CONFIRM | ACTION_CLICK;
  });

  return {
    /** Steering as { x, y } in -1..1, normalised by the world. */
    move() {
      return { x: (held.right ? 1 : 0) - (held.left ? 1 : 0), y: (held.down ? 1 : 0) - (held.up ? 1 : 0) };
    },
    sneaking() {
      return held.sneak;
    },
    sprinting() {
      return held.sprint;
    },
    /** The mouse position in logical game coordinates (the coin's aim). */
    aim() {
      return mouse;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
