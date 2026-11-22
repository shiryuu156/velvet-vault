// Drawing only: the world's state and the current screen in, pixels out. The 1280x800
// room is scaled to fit the window and centred. The look is a gallery at night: dark
// teal cover, amber guard cones, red camera cones, gold loot — safe, danger and prize
// readable at a glance, even shrunk to a contact sheet.
import { ALARM, PALETTE, THIEF, TOOLS, VIEW } from './config.js';
import { alarmBand } from './alarm.js';
import { GUARD_CHASE, GUARD_INVESTIGATE, GUARD_SUSPICIOUS } from './guard.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const HUD_H = 64;

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, origin, angle, range, halfAngle, fill, edge) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.arc(origin.x, origin.y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  const gradient = ctx.createRadialGradient(origin.x, origin.y, 10, origin.x, origin.y, range);
  gradient.addColorStop(0, fill);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(origin.x + Math.cos(angle - halfAngle) * range, origin.y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(origin.x + Math.cos(angle + halfAngle) * range, origin.y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
  ctx.restore();
}

function drawGemShape(ctx, x, y, size, glow) {
  ctx.save();
  ctx.translate(x, y);
  if (glow) {
    ctx.shadowColor = PALETTE.loot;
    ctx.shadowBlur = 22;
  }
  ctx.fillStyle = PALETTE.loot;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.75, -size * 0.2);
  ctx.lineTo(size * 0.4, size);
  ctx.lineTo(-size * 0.4, size);
  ctx.lineTo(-size * 0.75, -size * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.4, -size * 0.2);
  ctx.lineTo(0, size * 0.35);
  ctx.lineTo(-size * 0.4, -size * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
    canvas.width = VIEW.width;
    canvas.height = VIEW.height;
    canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
    canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
  }
  fit();
  window.addEventListener('resize', fit);

  function drawFloor(level) {
    ctx.fillStyle = PALETTE.floorA;
    ctx.fillRect(0, HUD_H, VIEW.width, VIEW.height - HUD_H);
    ctx.fillStyle = PALETTE.floorB;
    for (let y = HUD_H; y < VIEW.height; y += 64) {
      for (let x = (y / 64) % 2 === 0 ? 0 : 32; x < VIEW.width; x += 64) {
        ctx.fillRect(x, y, 32, 32);
      }
    }
    for (const rug of level.rugs) {
      ctx.fillStyle = PALETTE.rug;
      ctx.fillRect(rug.x, rug.y, rug.w, rug.h);
      ctx.strokeStyle = PALETTE.rugTrim;
      ctx.lineWidth = 3;
      ctx.strokeRect(rug.x + 8, rug.y + 8, rug.w - 16, rug.h - 16);
    }
    for (const s of level.shadows) {
      ctx.fillStyle = PALETTE.shadow;
      roundedRect(ctx, s.x, s.y, s.w, s.h, 14);
      ctx.fill();
      ctx.fillStyle = 'rgba(140, 190, 230, 0.35)';
      ctx.font = '600 13px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('SHADOW — hard to spot', s.x + s.w / 2, s.y + 22);
    }
  }

  function drawFurniture(level) {
    for (const c of level.cover) {
      ctx.fillStyle = PALETTE.cover;
      roundedRect(ctx, c.x, c.y, c.w, c.h, 8);
      ctx.fill();
      ctx.strokeStyle = PALETTE.coverTrim;
      ctx.lineWidth = 2;
      roundedRect(ctx, c.x, c.y, c.w, c.h, 8);
      ctx.stroke();
      ctx.fillStyle = 'rgba(220, 240, 230, 0.5)';
      ctx.font = '600 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(c.label.toUpperCase(), c.x + c.w / 2, c.y + c.h / 2 + 4);
    }
    for (const wall of level.walls) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeStyle = PALETTE.wallTrim;
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
    }
  }

  function drawExit(level, gemTaken) {
    const e = level.exit;
    ctx.save();
    ctx.fillStyle = gemTaken ? 'rgba(89, 227, 137, 0.28)' : 'rgba(120, 120, 130, 0.25)';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = gemTaken ? PALETTE.exit : '#888';
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = gemTaken ? PALETTE.exit : '#aaa';
    ctx.font = '700 16px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 - 10);
    ctx.font = '700 11px ' + FONT;
    ctx.fillText(gemTaken ? 'GETAWAY' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 8);
    ctx.fillText(gemTaken ? 'OPEN' : 'TAKE STAR', e.x + e.w / 2, e.y + e.h / 2 + 24);
    ctx.restore();
  }

  function drawLoot(state) {
    const level = state.level;
    for (const t of level.trinkets) {
      if (t.taken) continue;
      drawGemShape(ctx, t.x, t.y, 9, false);
    }
    for (const k of level.kits) {
      if (k.taken) continue;
      ctx.fillStyle = '#59b7e3';
      roundedRect(ctx, k.x - 12, k.y - 10, 24, 20, 5);
      ctx.fill();
      ctx.fillStyle = '#06222e';
      ctx.font = '700 13px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('+', k.x, k.y + 5);
      ctx.fillStyle = 'rgba(89, 183, 227, 0.8)';
      ctx.font = '600 10px ' + FONT;
      ctx.fillText('TOOL KIT', k.x, k.y + 24);
    }
    if (!state.gemTaken) {
      const g = level.gem;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 215, 94, 0.12)';
      ctx.beginPath();
      ctx.moveTo(g.x - 26, g.y + 40);
      ctx.lineTo(g.x + 26, g.y + 40);
      ctx.lineTo(g.x + 8, g.y - 70);
      ctx.lineTo(g.x - 8, g.y - 70);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#3a3350';
      roundedRect(ctx, g.x - 22, g.y + 26, 44, 16, 4);
      ctx.fill();
      drawGemShape(ctx, g.x, g.y, 18, true);
      ctx.fillStyle = PALETTE.loot;
      ctx.font = '700 13px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('THE ARGENT STAR', g.x, g.y - 52);
    }
  }

  function drawGuards(state) {
    for (const guard of state.guards) {
      const chasing = guard.state === GUARD_CHASE;
      drawCone(
        ctx,
        guard,
        guard.angle,
        guard.spec.range,
        guard.spec.halfAngle,
        chasing ? 'rgba(255, 70, 70, 0.45)' : PALETTE.guardCone,
        chasing ? 'rgba(255, 70, 70, 0.9)' : PALETTE.guardConeEdge,
      );
    }
    for (const guard of state.guards) {
      const chasing = guard.state === GUARD_CHASE;
      ctx.save();
      ctx.translate(guard.x, guard.y);
      ctx.rotate(guard.angle);
      ctx.fillStyle = chasing ? '#c22f2f' : '#3d4a6b';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath();
      ctx.arc(5, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#20263a';
      ctx.fillRect(6, -3, 10, 6);
      ctx.restore();
      // Suspicion meter above the head: the fair warning before the chase.
      if (guard.suspicion > 0.03) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(guard.x - 18, guard.y - 32, 36, 7);
        ctx.fillStyle = guard.suspicion >= 1 ? '#ff4646' : '#ffb042';
        ctx.fillRect(guard.x - 17, guard.y - 31, 34 * Math.min(1, guard.suspicion), 5);
      }
      if (guard.state === GUARD_SUSPICIOUS || guard.state === GUARD_INVESTIGATE) {
        ctx.fillStyle = '#ffb042';
        ctx.font = '700 18px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - 38);
      } else if (chasing) {
        ctx.fillStyle = '#ff4646';
        ctx.font = '700 18px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 38);
      }
    }
  }

  function drawCameras(state) {
    for (const camera of state.cameras) {
      const off = camera.disabled > 0;
      if (!off) {
        drawCone(ctx, camera, camera.angle, camera.spec.range, camera.spec.halfAngle, PALETTE.cameraCone, PALETTE.cameraConeEdge);
      }
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.rotate(camera.angle);
      ctx.fillStyle = off ? '#555' : '#7a2030';
      roundedRect(ctx, -6, -6, 22, 12, 4);
      ctx.fill();
      ctx.fillStyle = off ? '#888' : '#ff5c7a';
      ctx.beginPath();
      ctx.arc(16, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = off ? '#999' : '#ff5c7a';
      ctx.font = '700 10px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(off ? 'CAM OFF' : 'CAM', camera.x, camera.y - 14);
    }
  }

  function drawThief(state) {
    const t = state.thief;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.facing);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.thiefHood;
    ctx.beginPath();
    ctx.arc(0, 0, THIEF.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.thief;
    ctx.beginPath();
    ctx.arc(4, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#171224';
    ctx.beginPath();
    ctx.arc(7, -2.5, 1.8, 0, Math.PI * 2);
    ctx.arc(7, 2.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (t.hasGem) {
      drawGemShape(ctx, t.x, t.y - 24, 8, true);
    }
    if (t.sneaking) {
      ctx.fillStyle = 'rgba(232, 228, 242, 0.75)';
      ctx.font = '600 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('SNEAKING', t.x, t.y + 30);
    }
  }

  function drawTools(state) {
    for (const coin of state.tools.coins) {
      ctx.strokeStyle = 'rgba(255, 215, 94, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 10 + (3 - coin.ttl) * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const smoke of state.tools.smokes) {
      ctx.fillStyle = PALETTE.smoke;
      ctx.beginPath();
      ctx.arc(smoke.x, smoke.y, TOOLS.smoke.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHud(state, best) {
    ctx.fillStyle = '#100c1e';
    ctx.fillRect(0, 0, VIEW.width, HUD_H);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, HUD_H);
    ctx.lineTo(VIEW.width, HUD_H);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8e4f2';
    ctx.font = '700 20px ' + FONT;
    ctx.fillText('VELVET VAULT', 18, 28);
    ctx.fillStyle = '#9b93b8';
    ctx.font = '600 13px ' + FONT;
    ctx.fillText(state.level.name, 18, 48);

    ctx.fillStyle = PALETTE.loot;
    ctx.font = '700 18px ' + FONT;
    ctx.fillText(`LOOT $${state.loot}`, 330, 30);
    ctx.fillStyle = '#9b93b8';
    ctx.font = '600 13px ' + FONT;
    ctx.fillText(`SCORE ${state.score}   BEST ${best}`, 330, 50);

    // The alarm meter: the single most important number in the game.
    const meter = { x: 640, y: 14, w: 300, h: 22 };
    const band = alarmBand(state.alarm);
    ctx.fillStyle = '#2a2438';
    roundedRect(ctx, meter.x, meter.y, meter.w, meter.h, 6);
    ctx.fill();
    const fillW = (meter.w * state.alarm.value) / 100;
    ctx.fillStyle = band === 'danger' ? '#ff4646' : band === 'warn' ? '#ffb042' : '#59e389';
    if (fillW > 0) {
      roundedRect(ctx, meter.x, meter.y, Math.max(fillW, 8), meter.h, 6);
      ctx.fill();
    }
    ctx.strokeStyle = '#4a3f66';
    ctx.lineWidth = 2;
    roundedRect(ctx, meter.x, meter.y, meter.w, meter.h, 6);
    ctx.stroke();
    ctx.fillStyle = '#e8e4f2';
    ctx.font = '700 13px ' + FONT;
    ctx.textAlign = 'right';
    ctx.fillText('ALARM', meter.x - 10, meter.y + 16);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '700 14px ' + FONT;
    ctx.fillText(
      state.alarm.lockdown ? 'LOCKDOWN!' : `${Math.round(state.alarm.value)}%`,
      meter.x + meter.w / 2,
      meter.y + 16,
    );
    ctx.fillStyle = '#9b93b8';
    ctx.font = '600 11px ' + FONT;
    ctx.fillText(state.gemTaken ? 'Star taken — reach the EXIT' : 'Take the Argent Star, then exit', meter.x + meter.w / 2, 52);

    // Tool charges.
    const tools = [
      { label: 'Q COIN', n: state.thief.charges.coin },
      { label: 'E SMOKE', n: state.thief.charges.smoke },
      { label: 'R EMP', n: state.thief.charges.emp },
    ];
    tools.forEach((tool, i) => {
      const x = 990 + i * 90;
      ctx.fillStyle = tool.n > 0 ? '#2a2438' : '#3a2430';
      roundedRect(ctx, x, 12, 80, 40, 6);
      ctx.fill();
      ctx.strokeStyle = tool.n > 0 ? '#4a3f66' : '#6b2f2f';
      ctx.lineWidth = 1.5;
      roundedRect(ctx, x, 12, 80, 40, 6);
      ctx.stroke();
      ctx.fillStyle = tool.n > 0 ? '#e8e4f2' : '#8a6a6a';
      ctx.font = '700 12px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(tool.label, x + 40, 28);
      ctx.font = '700 16px ' + FONT;
      ctx.fillText(`x${tool.n}`, x + 40, 46);
    });
  }

  function drawHint(state) {
    ctx.fillStyle = 'rgba(16, 12, 30, 0.85)';
    ctx.fillRect(0, VIEW.height - 26, VIEW.width, 26);
    ctx.fillStyle = '#9b93b8';
    ctx.font = '600 13px ' + FONT;
    ctx.textAlign = 'center';
    const now = state.elapsed;
    const text =
      now < state.messageUntil && state.message
        ? state.message
        : 'WASD / arrows move · Shift sneak · Space sprint · Q coin · E smoke · R EMP · P pause';
    ctx.fillText(text, VIEW.width / 2, VIEW.height - 8);
  }

  function drawWorld(state, best) {
    drawFloor(state.level);
    drawExit(state.level, state.gemTaken);
    drawLoot(state);
    drawGuards(state);
    drawCameras(state);
    drawFurniture(state.level);
    drawTools(state);
    drawThief(state);
    drawHud(state, best);
    drawHint(state);
    if (state.alarm.lockdown) {
      ctx.strokeStyle = 'rgba(255, 70, 70, 0.7)';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, HUD_H + 3, VIEW.width - 6, VIEW.height - HUD_H - 6);
    }
  }

  function drawPanel(title, lines, prompt, accent) {
    ctx.fillStyle = 'rgba(10, 7, 20, 0.82)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    const w = 680;
    const h = 150 + lines.length * 34;
    const x = (VIEW.width - w) / 2;
    const y = (VIEW.height - h) / 2;
    ctx.fillStyle = '#1d1830';
    roundedRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    roundedRect(ctx, x, y, w, h, 14);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = '700 34px ' + FONT;
    ctx.fillText(title, VIEW.width / 2, y + 58);
    ctx.fillStyle = '#e8e4f2';
    ctx.font = '600 17px ' + FONT;
    lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, y + 106 + i * 34));
    ctx.fillStyle = '#9b93b8';
    ctx.font = '600 15px ' + FONT;
    ctx.fillText(prompt, VIEW.width / 2, y + h - 24);
  }

  function drawTitle(state, best) {
    drawWorld(state, best);
    drawPanel(
      'VELVET VAULT',
      [
        'A midnight heist in the Halden Gallery.',
        'Cross each room, lift the Argent Star, slip out the east door.',
        'Read the cones before you move. The alarm forgives nothing.',
      ],
      'Press Space or click to begin',
      PALETTE.loot,
    );
  }

  function drawCaught(state, best) {
    drawWorld(state, best);
    drawPanel(
      'CAUGHT!',
      [
        `The guards closed in with the alarm at ${Math.round(state.alarm.value)}%.`,
        `Loot kept: $${state.loot}   Score: ${state.score}   Best: ${best}`,
        'Next time, watch the cones — and keep a smoke puff in reserve.',
      ],
      'Press Space or click to try again',
      '#ff4646',
    );
  }

  function drawEscaped(state, best) {
    drawWorld(state, best);
    const ghost = state.ghost ? 'Ghost bonus earned — never seen above 25% alarm.' : 'Seen along the way, but the Star is yours.';
    drawPanel(
      'CLEAN GETAWAY!',
      [
        `All three rooms cleared. Loot: $${state.loot}   Score: ${state.score}   Best: ${best}`,
        ghost,
        'Wren slips into the night. The gallery never knew what hit it.',
      ],
      'Press Space or click to run it again',
      PALETTE.exit,
    );
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_CAUGHT) drawCaught(state, best);
    else if (screen === SCREEN_ESCAPED) drawEscaped(state, best);
    else {
      drawWorld(state, best);
      if (screen === SCREEN_PAUSED) {
        drawPanel('PAUSED', ['The gallery waits. The guards do not move.'], 'Press P or Space to keep going', '#9b93b8');
      }
    }
  }

  return { draw, fit };
}
