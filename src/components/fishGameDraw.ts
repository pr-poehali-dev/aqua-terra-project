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
  // Хвост
  ctx.beginPath(); ctx.moveTo(-20, 0);
  ctx.bezierCurveTo(-32, -13 + wag * 10, -42, -11 + wag * 15, -40, wag * 7);
  ctx.bezierCurveTo(-42, 11 + wag * 15, -32, 13 + wag * 10, -20, 0); ctx.closePath();
  const tg = ctx.createLinearGradient(-42, 0, -20, 0);
  tg.addColorStop(0, dead ? '#555' : '#0369a1'); tg.addColorStop(1, dead ? '#777' : '#0ea5e9');
  ctx.fillStyle = tg; ctx.fill();
  // Тело
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI * 2);
  const bg = ctx.createLinearGradient(-24, -12, 24, 12);
  bg.addColorStop(0, dead ? '#6b7280' : '#38bdf8'); bg.addColorStop(0.4, dead ? '#4b5563' : '#0ea5e9'); bg.addColorStop(1, dead ? '#374151' : '#0369a1');
  ctx.fillStyle = bg; ctx.fill();
  ctx.beginPath(); ctx.ellipse(2, 4, 18, 7, 0.15, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
  // Плавники
  ctx.beginPath(); ctx.moveTo(-8, -12); ctx.bezierCurveTo(-4, -22, 9, -21, 14, -12); ctx.closePath();
  ctx.fillStyle = dead ? 'rgba(100,100,100,0.7)' : 'rgba(14,165,233,0.75)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, 10); ctx.bezierCurveTo(5, 18, 13, 20, 14, 10); ctx.closePath();
  ctx.fillStyle = dead ? 'rgba(100,100,100,0.6)' : 'rgba(56,189,248,0.6)'; ctx.fill();
  // Чешуя
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-10 + i * 9, -1, 6, 4, -0.2, Math.PI, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.9; ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.bezierCurveTo(-4, -5, 8, -4, 20, 0); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Глаз
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

export function drawNet(ctx: CanvasRenderingContext2D, _handX: number, handY: number, _a: number, lunge: number) {
  // Pivot всегда за правым краем canvas, двигается только по Y вслед за рыбкой
  const pivotX = W + 30;
  const pivotY = handY;
  const armLen = 155;
  // Бросок: от -π (влево, покой) к -π*0.5 (вниз-влево, зачерпнул)
  // В покое сачок торчит горизонтально влево, при броске опускается вниз-влево
  const sweepStart = -Math.PI;       // влево — покой
  const sweepEnd   = -Math.PI * 0.6; // вниз-влево — бросок
  const sweepAngle = sweepStart + lunge * (sweepEnd - sweepStart);

  const netX = pivotX + Math.cos(sweepAngle) * armLen;
  const netY = pivotY + Math.sin(sweepAngle) * armLen;
  const armAngle = sweepAngle;

  // ── РУЧКА ──
  ctx.save();
  // Тень
  ctx.beginPath(); ctx.moveTo(pivotX + 2, pivotY + 3); ctx.lineTo(netX + 2, netY + 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
  // Серебристый стержень
  const sg = ctx.createLinearGradient(netX, netY, pivotX, pivotY);
  sg.addColorStop(0, '#94a3b8'); sg.addColorStop(0.4, '#e2e8f0'); sg.addColorStop(1, '#64748b');
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(netX, netY);
  ctx.strokeStyle = sg; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
  // Блик
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(netX, netY);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2.5; ctx.stroke();
  // Кольца-стыки
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    const rx = pivotX + (netX - pivotX) * t, ry = pivotY + (netY - pivotY) * t;
    const perp = armAngle - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(rx + Math.cos(perp) * 5, ry + Math.sin(perp) * 5);
    ctx.lineTo(rx - Math.cos(perp) * 5, ry - Math.sin(perp) * 5);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  // Красная рукоятка (ближняя к руке часть)
  const g1x = pivotX, g1y = pivotY;
  const g2x = pivotX + (netX - pivotX) * 0.28, g2y = pivotY + (netY - pivotY) * 0.28;
  ctx.beginPath(); ctx.moveTo(g1x, g1y); ctx.lineTo(g2x, g2y);
  ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(g1x, g1y); ctx.lineTo(g2x, g2y);
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 9; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(g1x, g1y); ctx.lineTo(g2x, g2y);
  ctx.strokeStyle = 'rgba(255,150,150,0.3)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();

  // ── РУКА (торчит вправо за край canvas) ──
  ctx.save(); ctx.translate(pivotX, pivotY);
  // Рукав уходит вправо за край
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(60, -8);
  ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 38; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(60, -8);
  ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 30; ctx.stroke();
  // Манжета у pivot
  ctx.beginPath(); ctx.ellipse(0, 0, 20, 13, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#1d4ed8'; ctx.fill(); ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 20, 13, 0.1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 3; ctx.stroke();
  // Ладонь
  ctx.beginPath();
  ctx.moveTo(-14, 4); ctx.bezierCurveTo(-18, 12, -12, 24, -3, 26);
  ctx.bezierCurveTo(6, 28, 18, 18, 18, 9); ctx.bezierCurveTo(18, -2, 10, -7, -14, 4);
  ctx.fillStyle = '#fcd5a8'; ctx.fill(); ctx.strokeStyle = '#c8875a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Пальцы
  for (let f = 0; f < 4; f++) {
    ctx.beginPath();
    ctx.moveTo(-10 + f * 8, 9); ctx.bezierCurveTo(-12 + f * 8, 2, -7 + f * 8, 0, -5 + f * 8, 9);
    ctx.fillStyle = '#fde0bc'; ctx.fill(); ctx.strokeStyle = '#c8875a'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(-10 + f * 8, 9 + f * 1.5, 3.5, 0.7, 2.4);
    ctx.strokeStyle = '#d4956a'; ctx.lineWidth = 0.9; ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(-16, 2, 7, 5, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#fcd5a8'; ctx.fill(); ctx.strokeStyle = '#c8875a'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();

  // ── САЧОК ──
  ctx.save(); ctx.translate(netX, netY);
  const faceAngle = armAngle + Math.PI / 2;
  ctx.rotate(faceAngle);
  const R = 36;
  const bagDepth = R * 0.85 + lunge * R * 0.35;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, R - 2, 0, Math.PI * 2);
  ctx.moveTo(-R, bagDepth);
  ctx.bezierCurveTo(-R, R * 0.3, -R * 0.4, bagDepth, 0, bagDepth);
  ctx.bezierCurveTo(R * 0.4, bagDepth, R, R * 0.3, R, bagDepth);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = 'rgba(127,0,0,0.45)';
  ctx.fillRect(-R, -R, R * 2, R + bagDepth + 10);
  const cell = 9;
  ctx.strokeStyle = 'rgba(220,38,38,0.85)'; ctx.lineWidth = 1.1;
  for (let d = -R * 3; d < R * 3 + bagDepth; d += cell) {
    ctx.beginPath(); ctx.moveTo(d, -R); ctx.lineTo(d + R + bagDepth + 20, R + bagDepth + 20); ctx.stroke();
  }
  for (let d = -R * 3; d < R * 3 + bagDepth; d += cell) {
    ctx.beginPath(); ctx.moveTo(d, -R); ctx.lineTo(d - R - bagDepth - 20, R + bagDepth + 20); ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  const rg2 = ctx.createLinearGradient(-R, -R, R, R);
  rg2.addColorStop(0, '#dc2626'); rg2.addColorStop(0.45, '#ef4444'); rg2.addColorStop(0.55, '#fca5a5'); rg2.addColorStop(1, '#b91c1c');
  ctx.strokeStyle = rg2; ctx.lineWidth = 7; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.strokeStyle = 'rgba(255,200,200,0.5)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -R + 4); ctx.lineTo(0, -R - 2); ctx.lineTo(6, -R + 4);
  ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -R + 4); ctx.lineTo(0, -R - 2); ctx.lineTo(6, -R + 4);
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
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