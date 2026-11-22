// Velvet Vault: every tuned number lives here, so the rest of the code reads as rules, not magic.
export const STEP = 1 / 60;
export const VIEW = { width: 1280, height: 800 };
export const BEST_KEY = 'velvet-vault-best';

// The thief.
export const THIEF = {
  radius: 13,
  walkSpeed: 170,
  sneakSpeed: 95,
  sprintSpeed: 235,
  grabRange: 34,
  exitRange: 40,
};

// How fast being seen fills a guard's suspicion (per second, at full exposure).
export const SPOT_RATE = 1.15;
export const SPOT_RATE_SNEAK = 0.38;
export const SPOT_RATE_SHADOW = 0.5;
export const SPOT_RATE_CLOSE = 1.6;
export const FORGET_RATE = 0.45;

// The alarm meter, 0..100.
export const ALARM = {
  seenRate: 22,
  chaseRate: 38,
  cameraRate: 26,
  decayRate: 7,
  lockdownDecay: 3,
  warnAt: 40,
  dangerAt: 75,
  lockdownAt: 100,
};

// Tools: what each one costs and how long it lasts. Charges are the currency.
export const TOOLS = {
  coin: { key: 'Q', start: 3, throwRange: 240, hearRadius: 280, label: 'Noise coin' },
  smoke: { key: 'E', start: 2, radius: 95, seconds: 4, label: 'Smoke puff' },
  emp: { key: 'R', start: 1, seconds: 8, label: 'EMP burst' },
};

// Scoring.
export const SCORE = {
  gem: 500,
  trinket: 50,
  kit: 25,
  ghostBonus: 200,
  timeBonusPerSecond: 5,
};

// Colours: safe cover reads dark teal, danger reads amber and red, loot reads gold.
export const PALETTE = {
  floorA: '#2a2438',
  floorB: '#251f33',
  wall: '#171224',
  wallTrim: '#4a3f66',
  cover: '#1d3a34',
  coverTrim: '#3f7a6a',
  shadow: '#16283a',
  rug: '#38305e',
  rugTrim: '#6f5da8',
  guardCone: 'rgba(255, 176, 66, 0.34)',
  guardConeEdge: 'rgba(255, 176, 66, 0.85)',
  cameraCone: 'rgba(255, 92, 122, 0.30)',
  cameraConeEdge: 'rgba(255, 92, 122, 0.8)',
  loot: '#ffd75e',
  exit: '#59e389',
  thief: '#e8e4f2',
  thiefHood: '#7c6bb0',
  smoke: 'rgba(200, 205, 220, 0.55)',
};
