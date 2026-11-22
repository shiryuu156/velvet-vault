// The three rooms of the Halden Gallery, each a floor plan the thief can read at a glance:
// walls block movement and sight, cover blocks sight, shadow halves how fast you are spotted,
// and every room has at least three ways through it. Coordinates are logical 1280x800 pixels;
// the HUD lives in the top 64, so rooms start at y = 80.

// A rect is { x, y, w, h }. A patrol is a list of waypoints the guard walks in a loop.
function room({ name, brief, walls, cover, shadows, rugs, guards, cameras, gem, trinkets, kits, exit, spawn }) {
  return { name, brief, walls, cover, shadows, rugs, guards, cameras, gem, trinkets, kits, exit, spawn };
}

const HALL_WALLS = [
  { x: 0, y: 80, w: 1280, h: 18 },
  { x: 0, y: 782, w: 1280, h: 18 },
  { x: 0, y: 80, w: 18, h: 720 },
  { x: 1262, y: 80, w: 18, h: 720 },
];

export const LEVELS = [
  room({
    name: 'Room 1 — The Marble Hall',
    brief: 'Cross the hall, lift the Argent Star, reach the east door.',
    walls: [
      ...HALL_WALLS,
      { x: 430, y: 80, w: 18, h: 190 },
      { x: 830, y: 610, w: 18, h: 190 },
      { x: 560, y: 430, w: 160, h: 18 },
    ],
    cover: [
      { x: 180, y: 220, w: 120, h: 70, label: 'display case' },
      { x: 180, y: 560, w: 120, h: 70, label: 'display case' },
      { x: 520, y: 180, w: 240, h: 60, label: 'long case' },
      { x: 980, y: 220, w: 120, h: 70, label: 'display case' },
      { x: 980, y: 560, w: 120, h: 70, label: 'display case' },
      { x: 560, y: 620, w: 160, h: 56, label: 'crates' },
    ],
    shadows: [
      { x: 60, y: 320, w: 200, h: 130 },
      { x: 1020, y: 320, w: 200, h: 130 },
      { x: 560, y: 470, w: 160, h: 110 },
    ],
    rugs: [{ x: 470, y: 280, w: 340, h: 150 }],
    guards: [
      { waypoints: [[380, 340], [380, 620], [640, 620], [640, 340]], speed: 62, range: 185, halfAngle: 0.62, pause: 1.1 },
      { waypoints: [[900, 180], [900, 480], [1120, 480], [1120, 180]], speed: 70, range: 185, halfAngle: 0.62, pause: 0.8 },
    ],
    cameras: [
      { x: 640, y: 100, arc: [0.5, 2.6], sweepSeconds: 7, range: 230, halfAngle: 0.5 },
    ],
    gem: { x: 640, y: 330, name: 'the Argent Star' },
    trinkets: [
      { x: 240, y: 180, taken: false },
      { x: 1040, y: 660, taken: false },
      { x: 640, y: 700, taken: false },
    ],
    kits: [{ x: 110, y: 700, taken: false }],
    exit: { x: 1180, y: 360, w: 80, h: 90 },
    spawn: { x: 90, y: 440 },
  }),
  room({
    name: 'Room 2 — The Vault Corridor',
    brief: 'Two cameras sweep the corridor. Time the cones or burn an EMP.',
    walls: [
      ...HALL_WALLS,
      { x: 300, y: 80, w: 18, h: 300 },
      { x: 300, y: 520, w: 18, h: 280 },
      { x: 940, y: 80, w: 18, h: 300 },
      { x: 940, y: 520, w: 18, h: 280 },
      { x: 560, y: 300, w: 160, h: 18 },
      { x: 560, y: 560, w: 160, h: 18 },
    ],
    cover: [
      { x: 120, y: 200, w: 100, h: 60, label: 'crates' },
      { x: 120, y: 580, w: 100, h: 60, label: 'crates' },
      { x: 480, y: 150, w: 320, h: 56, label: 'long case' },
      { x: 480, y: 640, w: 320, h: 56, label: 'long case' },
      { x: 1060, y: 200, w: 100, h: 60, label: 'crates' },
      { x: 1060, y: 580, w: 100, h: 60, label: 'crates' },
    ],
    shadows: [
      { x: 330, y: 380, w: 180, h: 140 },
      { x: 770, y: 380, w: 180, h: 140 },
      { x: 560, y: 320, w: 160, h: 240 },
    ],
    rugs: [{ x: 500, y: 360, w: 280, h: 120 }],
    guards: [
      { waypoints: [[200, 300], [200, 620], [420, 620], [420, 300]], speed: 66, range: 190, halfAngle: 0.6, pause: 0.9 },
      { waypoints: [[640, 200], [640, 430], [860, 430], [860, 200]], speed: 74, range: 190, halfAngle: 0.6, pause: 0.7 },
      { waypoints: [[1080, 300], [1080, 620], [900, 620], [900, 300]], speed: 66, range: 190, halfAngle: 0.6, pause: 0.9 },
    ],
    cameras: [
      { x: 480, y: 100, arc: [0.4, 2.7], sweepSeconds: 6, range: 240, halfAngle: 0.48 },
      { x: 800, y: 780, arc: [-2.7, -0.4], sweepSeconds: 8, range: 240, halfAngle: 0.48 },
    ],
    gem: { x: 640, y: 420, name: 'the Argent Star' },
    trinkets: [
      { x: 200, y: 120, taken: false },
      { x: 1080, y: 120, taken: false },
      { x: 640, y: 120, taken: false },
      { x: 640, y: 740, taken: false },
    ],
    kits: [
      { x: 110, y: 440, taken: false },
      { x: 1170, y: 440, taken: false },
    ],
    exit: { x: 1180, y: 360, w: 80, h: 90 },
    spawn: { x: 90, y: 440 },
  }),
  room({
    name: 'Room 3 — The Argent Chamber',
    brief: 'The Star sits under the tightest patrol in the gallery. Ghost it.',
    walls: [
      ...HALL_WALLS,
      { x: 220, y: 80, w: 18, h: 240 },
      { x: 1040, y: 560, w: 18, h: 240 },
      { x: 480, y: 80, w: 18, h: 150 },
      { x: 780, y: 650, w: 18, h: 150 },
      { x: 540, y: 380, w: 200, h: 18 },
    ],
    cover: [
      { x: 120, y: 360, w: 110, h: 64, label: 'display case' },
      { x: 1050, y: 360, w: 110, h: 64, label: 'display case' },
      { x: 400, y: 200, w: 120, h: 64, label: 'display case' },
      { x: 760, y: 200, w: 120, h: 64, label: 'display case' },
      { x: 400, y: 580, w: 120, h: 64, label: 'display case' },
      { x: 760, y: 580, w: 120, h: 64, label: 'display case' },
      { x: 580, y: 500, w: 120, h: 56, label: 'crates' },
    ],
    shadows: [
      { x: 60, y: 460, w: 180, h: 140 },
      { x: 1040, y: 200, w: 180, h: 140 },
      { x: 560, y: 200, w: 160, h: 130 },
    ],
    rugs: [{ x: 480, y: 280, w: 320, h: 180 }],
    guards: [
      { waypoints: [[300, 250], [300, 600], [560, 600], [560, 250]], speed: 78, range: 200, halfAngle: 0.58, pause: 0.6 },
      { waypoints: [[980, 250], [980, 600], [720, 600], [720, 250]], speed: 78, range: 200, halfAngle: 0.58, pause: 0.6 },
      { waypoints: [[640, 180], [640, 330], [640, 180], [640, 700]], speed: 70, range: 200, halfAngle: 0.58, pause: 0.5 },
    ],
    cameras: [
      { x: 350, y: 100, arc: [0.5, 2.6], sweepSeconds: 5, range: 250, halfAngle: 0.46 },
      { x: 930, y: 100, arc: [0.5, 2.6], sweepSeconds: 6.5, range: 250, halfAngle: 0.46 },
    ],
    gem: { x: 640, y: 300, name: 'the Argent Star' },
    trinkets: [
      { x: 120, y: 120, taken: false },
      { x: 1160, y: 120, taken: false },
      { x: 120, y: 740, taken: false },
      { x: 1160, y: 740, taken: false },
    ],
    kits: [{ x: 640, y: 740, taken: false }],
    exit: { x: 1180, y: 360, w: 80, h: 90 },
    spawn: { x: 90, y: 440 },
  }),
];
