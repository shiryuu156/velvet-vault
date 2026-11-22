// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between five screens: title, play, paused, caught and escaped.
//
// ?seed=N fixes the patrol pauses. ?shot=cover|stealth|alarm|escape (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  createWorld,
  EVENT_CAUGHT,
  EVENT_ESCAPED,
  EVENT_GEM,
  EVENT_PICKUP,
  EVENT_ROOM_DONE,
  EVENT_SPOTTED,
  EVENT_TOOL,
} from './world.js';
import {
  ACTION_CLICK,
  ACTION_COIN,
  ACTION_CONFIRM,
  ACTION_EMP,
  ACTION_PAUSE,
  ACTION_SMOKE,
  createInput,
} from './input.js';
import {
  createRenderer,
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Cross the room, take the Argent Star, reach the east door.');
  }

  function finishRun(escaped) {
    screen = escaped ? SCREEN_ESCAPED : SCREEN_CAUGHT;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (escaped) audio.escaped();
    else audio.caught();
    announce(
      escaped
        ? `Clean getaway. Score ${world.state.score}. Best ${best}.`
        : `Caught. Score ${world.state.score}. Best ${best}.`,
    );
  }

  function toolUseFrom(actions) {
    if (actions & ACTION_COIN) return { kind: 'coin', at: input.aim() };
    if (actions & ACTION_SMOKE) return { kind: 'smoke', at: null };
    if (actions & ACTION_EMP) return { kind: 'emp', at: null };
    // A mouse click during play throws a coin where the player points.
    if (actions & ACTION_CLICK && screen === SCREEN_PLAY) return { kind: 'coin', at: input.aim() };
    return null;
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    return actions;
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { x: 0, y: 0 }, false, false, null);
      return;
    }
    const events = world.step(STEP, input.move(), input.sneaking(), input.sprinting(), toolUseFrom(actions));
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_GEM) audio.gem();
    if (events & EVENT_TOOL) audio.tool();
    if (events & EVENT_SPOTTED) audio.spotted();
    if (events & EVENT_ROOM_DONE) {
      announce(`Room cleared. ${world.state.level.name}.`);
    }
    if (events & EVENT_CAUGHT) finishRun(false);
    else if (events & EVENT_ESCAPED) finishRun(true);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      // One-shot actions (tools, confirm) fire on the first step only, never twice.
      let pending = actions;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(pending);
        pending = 0;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    audio.alarmLevel(screen === SCREEN_PLAY ? world.state.alarm.value / 100 : 0);
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting guards patrol unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Velvet Vault. Press Space or click to start the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
