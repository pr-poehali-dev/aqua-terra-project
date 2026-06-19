import { W, H, Bubble, Weed, Food } from './fishGameTypes';

export function drawFlake(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.4);
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(i / 6 * Math.PI * 2);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -7);
    ctx.strokeStyle = 'rgba(255,215,100,0.9)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -2.8); ctx.lineTo(2.5, -4.5); ctx.moveTo(0, -2.8); ctx.lineTo(-2.5, -4.5);
    ctx.strokeStyle = 'rgba(255,215,100,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,240,160,0.95)'; ctx.fill(); ctx.restore();
}

export function drawWorm(ctx: CanvasRenderingContext2D, x: number, y: number, wobble: number, vx: number, vy: number) {
  const baseAngle = Math.atan2(vy, vx) + Math.PI / 2;
  ctx.save(); ctx.translate(x, y); ctx.rotate(baseAngle);
  for (let i = 0; i < 6; i++) {
    const ox = Math.sin(wobble + i * 1.1) * 3.5, oy = i * 5;
    const r = i === 0 ? 4.5 : Math.max(4.5 - i * 0.5, 2);
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
    if (i === 0) { g.addColorStop(0, '#ff7043'); g.addColorStop(1, '#e64a19'); }
    else { g.addColorStop(0, '#a5d6a7'); g.addColorStop(1, '#66bb6a'); }
    ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    if (i > 0 && i % 2 === 0) { ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.stroke(); }
    if (i === 0) {
      ctx.beginPath(); ctx.arc(ox - 1.8, oy - 1.5, 1.4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ox - 1.8, oy - 1.5, 0.7, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
      ctx.beginPath(); ctx.arc(ox + 1.8, oy - 1.5, 1.4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ox + 1.8, oy - 1.5, 0.7, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
    }
  }
  ctx.restore();
}

export function drawFish(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, wag: number, scale = 1, dead = false, deadT = 0) {
  ctx.save(); ctx.translate(x, y);
  if (dead) { ctx.rotate(angle + deadT * 4); ctx.globalAlpha = Math.max(0, 1 - deadT * 1.5); }
  else ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.beginPath(); ctx.moveTo(-20, 0);
  ctx.bezierCurveTo(-32, -13 + wag * 10, -42, -11 + wag * 15, -40, wag * 7);
  ctx.bezierCurveTo(-42, 11 + wag * 15, -32, 13 + wag * 10, -20, 0); ctx.closePath();
  const tg = ctx.createLinearGradient(-42, 0, -20, 0);
  tg.addColorStop(0, dead ? '#555' : '#0369a1'); tg.addColorStop(1, dead ? '#777' : '#0ea5e9');
  ctx.fillStyle = tg; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI * 2);
  const bg = ctx.createLinearGradient(-24, -12, 24, 12);
  bg.addColorStop(0, dead ? '#6b7280' : '#38bdf8'); bg.addColorStop(0.4, dead ? '#4b5563' : '#0ea5e9'); bg.addColorStop(1, dead ? '#374151' : '#0369a1');
  ctx.fillStyle = bg; ctx.fill();
  ctx.beginPath(); ctx.ellipse(2, 4, 18, 7, 0.15, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-8, -12); ctx.bezierCurveTo(-4, -22, 9, -21, 14, -12); ctx.closePath();
  ctx.fillStyle = dead ? 'rgba(100,100,100,0.7)' : 'rgba(14,165,233,0.75)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, 10); ctx.bezierCurveTo(5, 18, 13, 20, 14, 10); ctx.closePath();
  ctx.fillStyle = dead ? 'rgba(100,100,100,0.6)' : 'rgba(56,189,248,0.6)'; ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-10 + i * 9, -1, 6, 4, -0.2, Math.PI, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.9; ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.bezierCurveTo(-4, -5, 8, -4, 20, 0); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(15, -3, 5.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(16, -3, 3.5, 0, Math.PI * 2);
  const eg = ctx.createRadialGradient(16, -3, 0, 16, -3, 3.5);
  eg.addColorStop(0, dead ? '#555' : '#1e3a5f'); eg.addColorStop(1, dead ? '#333' : '#0c1f35');
  ctx.fillStyle = eg; ctx.fill();
  if (!dead) { ctx.beginPath(); ctx.arc(17, -4, 1.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill(); }
  else { ctx.strokeStyle = '#777'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(13, -5); ctx.lineTo(17, -1); ctx.moveTo(17, -5); ctx.lineTo(13, -1); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(23, 2, 3.5, 0.3, Math.PI * 0.85);
  ctx.strokeStyle = dead ? 'rgba(80,80,80,0.8)' : 'rgba(3,105,161,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

// netCenterX, netCenterY — текущая позиция центра обруча сачка
// lunge 0..1 — степень броска
export function drawNet(
  ctx: CanvasRenderingContext2D,
  netCenterX: number,
  netCenterY: number,
  _a: number,
  lunge: number
) {
  // Pivot — за правым верхним углом canvas
  const pivotX = W + 20;
  const pivotY = -30;

  // Конец ручки = центр обруча
  const nx = netCenterX;
  const ny = netCenterY;

  // Угол ручки от pivot к сачку
  const armAngle = Math.atan2(ny - pivotY, nx - pivotX);
  const armLen = Math.sqrt((nx - pivotX) ** 2 + (ny - pivotY) ** 2);

  // ── РУЧКА ──
  ctx.save();
  // Clip чтобы не рисовать за правым краем
  ctx.beginPath(); ctx.rect(-10, -40, W + 15, H + 80); ctx.clip();

  // Тень
  ctx.beginPath(); ctx.moveTo(pivotX + 3, pivotY + 4); ctx.lineTo(nx + 3, ny + 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();

  // Стержень — металл
  const sg = ctx.createLinearGradient(pivotX, pivotY, nx, ny);
  sg.addColorStop(0, '#cbd5e1'); sg.addColorStop(0.35, '#f1f5f9'); sg.addColorStop(0.7, '#94a3b8'); sg.addColorStop(1, '#64748b');
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(nx, ny);
  ctx.strokeStyle = sg; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke();

  // Блик
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(nx, ny);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2.5; ctx.stroke();

  // Кольца-стыки
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const rx = pivotX + (nx - pivotX) * t, ry = pivotY + (ny - pivotY) * t;
    const perp = armAngle - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(rx + Math.cos(perp) * 6, ry + Math.sin(perp) * 6);
    ctx.lineTo(rx - Math.cos(perp) * 6, ry - Math.sin(perp) * 6);
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3; ctx.lineCap = 'butt'; ctx.stroke();
  }

  // Рукоятка (первые 20% от pivot — тёмная резина)
  const gripEnd = 0.2;
  const gx = pivotX + (nx - pivotX) * gripEnd, gy = pivotY + (ny - pivotY) * gripEnd;
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(gx, gy);
  ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(gx, gy);
  ctx.strokeStyle = '#292524'; ctx.lineWidth = 9; ctx.stroke();
  // Блик рукоятки
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(gx, gy);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 3; ctx.stroke();

  ctx.restore();

  // ── РУКА (за правым верхним краем) ──
  ctx.save(); ctx.translate(pivotX, pivotY);
  // Рукав уходит вправо-вверх за край
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(45, -30);
  ctx.strokeStyle = '#fcd5a8'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(45, -30);
  ctx.strokeStyle = '#f5bc8a'; ctx.lineWidth = 16; ctx.stroke();
  // Пальцы вокруг рукоятки
  const gripAngle = armAngle;
  for (let f = 0; f < 4; f++) {
    const fa = gripAngle + Math.PI + (f - 1.5) * 0.25;
    ctx.beginPath();
    ctx.moveTo(Math.cos(fa) * 5, Math.sin(fa) * 5);
    ctx.bezierCurveTo(
      Math.cos(fa) * 14 + Math.cos(fa + 0.2) * 4, Math.sin(fa) * 14 + Math.sin(fa + 0.2) * 4,
      Math.cos(fa + 0.5) * 14, Math.sin(fa + 0.5) * 14,
      Math.cos(fa + 0.65) * 6, Math.sin(fa + 0.65) * 6
    );
    ctx.strokeStyle = '#fcd5a8'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#e8a878'; ctx.lineWidth = 6; ctx.stroke();
  }
  // Большой палец
  const ta = gripAngle - 0.9;
  ctx.beginPath();
  ctx.moveTo(Math.cos(ta) * 5, Math.sin(ta) * 5);
  ctx.bezierCurveTo(Math.cos(ta) * 16, Math.sin(ta) * 16, Math.cos(ta + 0.6) * 16, Math.sin(ta + 0.6) * 16, Math.cos(ta + 0.8) * 7, Math.sin(ta + 0.8) * 7);
  ctx.strokeStyle = '#fcd5a8'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke();
  ctx.strokeStyle = '#e8a878'; ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();

  // ── САЧОК (полукруг, открытый вперёд) ──
  ctx.save(); ctx.translate(nx, ny);

  // Ориентация: открытый край смотрит в сторону движения (от pivot к сачку)
  // При броске сачок «черпает» — открыт в направлении движения рыбки
  ctx.rotate(armAngle + Math.PI / 2);

  const R = 28;
  const bagDepth = R * 0.9 + lunge * R * 0.5;

  // ── Мешок сетки ──
  ctx.save();
  // Clip: нижний полукруг + мешок
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI);       // нижний полукруг
  ctx.lineTo(R, bagDepth);
  ctx.bezierCurveTo(R * 0.5, bagDepth + R * 0.35, -R * 0.5, bagDepth + R * 0.35, -R, bagDepth);
  ctx.closePath();
  ctx.clip();

  // Фон мешка — тёмный с лёгкой прозрачностью
  ctx.fillStyle = 'rgba(5, 50, 80, 0.6)';
  ctx.fillRect(-R, 0, R * 2, bagDepth + R + 5);

  // Сетка — ромбовидная
  const cell = 9;
  ctx.strokeStyle = 'rgba(20, 160, 200, 0.65)'; ctx.lineWidth = 1;
  for (let d = -R * 2; d < R * 2 + bagDepth + 20; d += cell) {
    ctx.beginPath(); ctx.moveTo(d, -5); ctx.lineTo(d + bagDepth + R + 20, bagDepth + R + 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d, -5); ctx.lineTo(d - bagDepth - R - 20, bagDepth + R + 20); ctx.stroke();
  }
  ctx.restore();

  // Обруч — нижний полукруг (открытый)
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI);
  const rg = ctx.createLinearGradient(-R, 0, R, 0);
  rg.addColorStop(0, '#1e3a5f'); rg.addColorStop(0.5, '#475569'); rg.addColorStop(1, '#1e3a5f');
  ctx.strokeStyle = rg; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
  // Блик на обруче
  ctx.beginPath(); ctx.arc(0, 0, R, Math.PI * 0.1, Math.PI * 0.5);
  ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 2; ctx.stroke();

  // Перекладина (закрытый край — крепление к ручке)
  ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0);
  const bg2 = ctx.createLinearGradient(-R, 0, R, 0);
  bg2.addColorStop(0, '#334155'); bg2.addColorStop(0.5, '#64748b'); bg2.addColorStop(1, '#334155');
  ctx.strokeStyle = bg2; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();

  ctx.restore();

  // ── Отладочная зона поимки (убрать для прода) ──
  // ctx.save(); ctx.beginPath(); ctx.arc(nx, ny, R, 0, Math.PI*2);
  // ctx.strokeStyle='rgba(255,0,0,0.3)'; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
}

export function drawWeeds(ctx: CanvasRenderingContext2D, weeds: Weed[], time: number) {
  weeds.forEach(w => {
    const segH = w.totalH / w.segments;
    ctx.save(); ctx.translate(w.x, H);
    let px = 0, py = 0;
    for (let i = 0; i < w.segments; i++) {
      const sway = Math.sin(time * w.speed + w.phase + i * 0.5) * ((i + 1) * 4);
      const ny = -(i + 1) * segH;
      ctx.beginPath(); ctx.moveTo(px, py);
      ctx.bezierCurveTo(px + sway * 0.5 + 6, py - segH * 0.3, sway - 6, ny + segH * 0.3, sway, ny);
      ctx.strokeStyle = w.color; ctx.lineWidth = Math.max(1, 3 - i * 0.4); ctx.lineCap = 'round'; ctx.stroke();
      if (i === w.segments - 1) {
        ctx.beginPath(); ctx.ellipse(sway, ny, 5, 12, Math.sin(time * w.speed + w.phase + i) * 0.5 + 0.2, 0, Math.PI * 2);
        ctx.fillStyle = w.color; ctx.globalAlpha = 0.65; ctx.fill(); ctx.globalAlpha = 1;
      }
      px = sway; py = ny;
    }
    ctx.restore();
  });
}

export function drawBg(ctx: CanvasRenderingContext2D, time: number, bubbles: Bubble[]) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0c4a6e'); bg.addColorStop(1, '#082f49');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(5,25,45,0.7)'; ctx.fillRect(0, H - 22, W, 22);
  ctx.fillStyle = 'rgba(8,37,60,0.4)'; ctx.fillRect(0, H - 34, W, 14);
  ctx.globalAlpha = 0.035; ctx.fillStyle = '#7dd3fc';
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 173 + time * 0.007) % W), cy = ((i * 97 + time * 0.004) % (H * 0.55));
    ctx.beginPath(); ctx.ellipse(cx, cy, 40 + i * 8, 7, Math.sin(time * 0.001 + i) * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawBubbles(ctx: CanvasRenderingContext2D, bubbles: Bubble[]) {
  bubbles.forEach(b => {
    b.y -= b.speed; b.wobble += 0.03; b.x += Math.sin(b.wobble) * 0.35;
    if (b.y < -b.r) { b.y = H + b.r; b.x = Math.random() * W; }
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(125,211,252,${b.op})`; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${b.op * 0.7})`; ctx.fill();
  });
}
