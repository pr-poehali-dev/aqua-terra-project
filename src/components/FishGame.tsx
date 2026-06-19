import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  tgChannel: string;
  scoreToWin?: number;
  promoCode?: string;
}

const CANVAS_W = 600;
const CANVAS_H = 360;
const SCORE_TO_WIN = 25;

interface Food {
  x: number; y: number; vx: number; vy: number;
  type: 'flake' | 'worm'; id: number;
  wobble: number; wobbleSpeed: number; // для анимации червяка
  size: number;
}

let _id = 0;

function spawnFood(foods: Food[]) {
  const type: Food['type'] = Math.random() > 0.35 ? 'flake' : 'worm';
  const side = Math.floor(Math.random() * 4);
  let x = 0, y = 0, vx = 0, vy = 0;
  const spd = 1.5 + Math.random() * 2.0;
  if (side === 0) { x = 30 + Math.random() * (CANVAS_W-60); y = -16; vx = (Math.random()-0.5)*1.2; vy = spd; }
  else if (side === 1) { x = CANVAS_W+16; y = 20 + Math.random() * (CANVAS_H-40); vx = -spd; vy = (Math.random()-0.5)*1.2; }
  else if (side === 2) { x = 30 + Math.random() * (CANVAS_W-60); y = CANVAS_H+16; vx = (Math.random()-0.5)*1.2; vy = -spd; }
  else { x = -16; y = 20 + Math.random() * (CANVAS_H-40); vx = spd; vy = (Math.random()-0.5)*1.2; }
  foods.push({ x, y, vx, vy, type, id: _id++, wobble: Math.random()*Math.PI*2, wobbleSpeed: 0.12+Math.random()*0.08, size: type === 'worm' ? 1 : 0.8 + Math.random()*0.4 });
}

// Рисует хлопья корма — многоугольник неправильной формы
function drawFlake(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.3);
  const r1 = 6 * size, r2 = 3.5 * size;
  const pts = 7;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
    else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r1);
  g.addColorStop(0, 'rgba(255,220,130,0.95)');
  g.addColorStop(0.6, 'rgba(210,160,60,0.85)');
  g.addColorStop(1, 'rgba(170,110,20,0.4)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

// Рисует червяка — изгибающаяся цепочка сегментов
function drawWorm(ctx: CanvasRenderingContext2D, x: number, y: number, wobble: number, vx: number, vy: number) {
  const len = 5;
  const seg = 5;
  const speed = Math.sqrt(vx*vx + vy*vy);
  const angle = Math.atan2(vy, vx);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI/2);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const ox = Math.sin(wobble + i * 1.2) * 3;
    const oy = i * seg;
    const r = i === 0 ? 4.5 : 3.5 - i * 0.3;
    ctx.beginPath();
    ctx.arc(ox, oy, Math.max(r, 1.5), 0, Math.PI*2);
    ctx.fillStyle = i === 0
      ? `rgba(220,80,40,${0.95 - t*0.1})`
      : `rgba(180,90,30,${0.9 - t*0.15})`;
    ctx.fill();
    // глаза на голове
    if (i === 0) {
      ctx.beginPath(); ctx.arc(ox-2, oy-1, 1.2, 0, Math.PI*2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ox-2, oy-1, 0.6, 0, Math.PI*2);
      ctx.fillStyle = '#111'; ctx.fill();
    }
  }
  ctx.restore();
}

// Плавная рыбка через кривые Безье
function drawFish(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, tailWag: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const TW = tailWag; // хвостовое виляние

  // Тело — сглаженный эллипс
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI*2);
  const bodyGrad = ctx.createLinearGradient(-22, -11, 22, 11);
  bodyGrad.addColorStop(0, '#38bdf8');
  bodyGrad.addColorStop(0.5, '#0ea5e9');
  bodyGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Хвост через кривую Безье
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.bezierCurveTo(-28, -12 + TW*8, -38, -10 + TW*14, -36, TW*6);
  ctx.bezierCurveTo(-38, 10 + TW*14, -28, 12 + TW*8, -18, 0);
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(-36, 0, -18, 0);
  tailGrad.addColorStop(0, '#0369a1');
  tailGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = tailGrad;
  ctx.fill();

  // Верхний плавник
  ctx.beginPath();
  ctx.moveTo(-5, -11);
  ctx.bezierCurveTo(-2, -21, 10, -20, 14, -11);
  ctx.closePath();
  ctx.fillStyle = 'rgba(56,189,248,0.7)';
  ctx.fill();

  // Брюшной плавник
  ctx.beginPath();
  ctx.moveTo(0, 11);
  ctx.bezierCurveTo(2, 17, 8, 18, 10, 11);
  ctx.closePath();
  ctx.fillStyle = 'rgba(56,189,248,0.6)';
  ctx.fill();

  // Боковая полоса
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.bezierCurveTo(-4, -4, 8, -4, 18, 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Чешуя — несколько полукружий
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-4 + i*8, 0, 6, Math.PI, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Глаз
  ctx.beginPath();
  ctx.arc(14, -3, 5, 0, Math.PI*2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(15, -3, 3, 0, Math.PI*2);
  ctx.fillStyle = '#1e3a5f';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(15.5, -4, 1, 0, Math.PI*2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Рот
  ctx.beginPath();
  ctx.arc(21, 2, 3, 0.2, Math.PI*0.8);
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

export default function FishGame({ tgChannel, scoreToWin = SCORE_TO_WIN, promoCode = 'AQUA10' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    fishX: CANVAS_W/2, fishY: CANVAS_H/2,
    fishVx: 0, fishVy: 0,
    targetX: CANVAS_W/2, targetY: CANVAS_H/2,
    fishAngle: 0,
    tailWag: 0, tailDir: 1,
    foods: [] as Food[],
    score: 0,
    alive: false,
    animId: 0,
    foodTimer: 0,
    lastTime: 0,
    bubbles: Array.from({length:12}, () => ({
      x: Math.random()*CANVAS_W, y: Math.random()*CANVAS_H,
      r: 2+Math.random()*4, speed: 0.2+Math.random()*0.4, opacity: 0.03+Math.random()*0.06
    })),
  });
  const [phase, setPhase] = useState<'idle'|'playing'|'won'>('idle');
  const [score, setScore] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);

  const loop = useCallback((time: number) => {
    const s = stateRef.current;
    if (!s.alive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const dt = Math.min(time - s.lastTime, 50);
    s.lastTime = time;

    // Спавн — каждые 500ms + бонусный пачкой при старте
    s.foodTimer += dt;
    const spawnInterval = 500;
    if (s.foodTimer > spawnInterval) {
      spawnFood(s.foods);
      if (s.foods.length < 3) spawnFood(s.foods); // доп если мало
      s.foodTimer = 0;
    }

    // Плавное движение рыбки
    const dx = s.targetX - s.fishX;
    const dy = s.targetY - s.fishY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const accel = 0.18;
    s.fishVx += dx * accel * 0.1;
    s.fishVy += dy * accel * 0.1;
    s.fishVx *= 0.82;
    s.fishVy *= 0.82;
    s.fishX += s.fishVx;
    s.fishY += s.fishVy;
    s.fishX = Math.max(24, Math.min(CANVAS_W-24, s.fishX));
    s.fishY = Math.max(14, Math.min(CANVAS_H-14, s.fishY));

    // Угол и хвост
    const speed = Math.sqrt(s.fishVx**2 + s.fishVy**2);
    if (speed > 0.5) s.fishAngle = Math.atan2(s.fishVy, s.fishVx);
    s.tailWag += s.tailDir * 0.15 * (0.5 + speed * 0.3);
    if (Math.abs(s.tailWag) > 1) s.tailDir *= -1;

    // Движение еды
    s.foods.forEach(f => {
      f.x += f.vx; f.y += f.vy;
      if (f.type === 'worm') f.wobble += f.wobbleSpeed;
    });
    s.foods = s.foods.filter(f =>
      f.x > -30 && f.x < CANVAS_W+30 && f.y > -30 && f.y < CANVAS_H+30
    );

    // Поедание
    s.foods = s.foods.filter(f => {
      const d = Math.sqrt((f.x-s.fishX)**2 + (f.y-s.fishY)**2);
      const eat = f.type === 'worm' ? 36 : 28;
      if (d < eat) {
        s.score += f.type === 'worm' ? 2 : 1;
        setScore(s.score);
        if (s.score >= scoreToWin) {
          s.alive = false;
          setPhase('won');
        }
        return false;
      }
      return true;
    });

    // Фон — подводный градиент
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, '#0c4a6e');
    bg.addColorStop(1, '#082f49');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Каустики (световые блики)
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#7dd3fc';
    for (let i = 0; i < 6; i++) {
      const cx = ((i*173 + time*0.008) % CANVAS_W);
      const cy = ((i*97 + time*0.005) % CANVAS_H);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 40+i*10, 8, Math.sin(time*0.001+i)*0.5, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Фоновые пузырьки
    s.bubbles.forEach(b => {
      b.y -= b.speed;
      if (b.y < -b.r) b.y = CANVAS_H + b.r;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(125,211,252,${b.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Еда
    s.foods.forEach(f => {
      if (f.type === 'flake') drawFlake(ctx, f.x, f.y, f.size, time * 0.001);
      else drawWorm(ctx, f.x, f.y, f.wobble, f.vx, f.vy);
    });

    // Рыбка
    drawFish(ctx, s.fishX, s.fishY, s.fishAngle, s.tailWag);

    // Счёт
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🍖 ${s.score} / ${scoreToWin}`, 12, 26);

    // Подсказка при малом кол-ве еды
    if (s.foods.length < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Лови корм!', CANVAS_W/2, CANVAS_H - 12);
    }

    s.animId = requestAnimationFrame(loop);
  }, [scoreToWin]);

  const startGame = () => {
    const s = stateRef.current;
    s.fishX = CANVAS_W/2; s.fishY = CANVAS_H/2;
    s.fishVx = 0; s.fishVy = 0;
    s.targetX = CANVAS_W/2; s.targetY = CANVAS_H/2;
    s.fishAngle = 0; s.tailWag = 0;
    s.foods = []; s.score = 0; s.alive = true;
    s.foodTimer = 0; s.lastTime = performance.now();
    setScore(0); setPhase('playing'); setSubscribed(false); setCopied(false);
    cancelAnimationFrame(s.animId);
    // Стартовая пачка корма
    for (let i = 0; i < 5; i++) spawnFood(s.foods);
    s.animId = requestAnimationFrame(loop);
  };

  useEffect(() => () => cancelAnimationFrame(stateRef.current.animId), []);

  const onMove = (cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.targetX = (cx - rect.left) * (CANVAS_W / rect.width);
    stateRef.current.targetY = (cy - rect.top) * (CANVAS_H / rect.height);
  };

  return (
    <div className="relative w-full" style={{ maxWidth: CANVAS_W }}>
      <canvas
        ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        className="w-full rounded-2xl block"
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, cursor: phase === 'playing' ? 'crosshair' : 'default' }}
        onMouseMove={e => onMove(e.clientX, e.clientY)}
        onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchStart={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
      />

      {/* Idle */}
      {phase === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl text-white text-center p-6" style={{background:'linear-gradient(160deg,#0c4a6e 0%,#082f49 100%)'}}>
          <div className="text-5xl mb-3">🐟</div>
          <h3 className="text-2xl font-bold mb-2">Накорми рыбку!</h3>
          <p className="text-white/70 text-sm mb-1">Веди мышью — рыбка плывёт следом</p>
          <p className="text-white/70 text-sm mb-5">Собери <strong className="text-cyan-300">{scoreToWin} очков</strong> — получи промокод</p>
          <div className="flex gap-5 text-xs text-white/55 mb-6">
            <span>🌾 хлопья = 1 очко</span>
            <span>🪱 червяк = 2 очка</span>
          </div>
          <button onClick={startGame} className="px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-[#0c4a6e] font-bold rounded-xl transition-colors text-base shadow-lg">
            Начать игру
          </button>
        </div>
      )}

      {/* Won */}
      {phase === 'won' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl text-white text-center p-6" style={{background:'linear-gradient(160deg,#0c4a6e 0%,#082f49 100%)'}}>

          {!subscribed ? (<>
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-2xl font-bold mb-1">Ты набрал {score} очков!</h3>
            <p className="text-white/70 text-sm mb-5">Подпишись на Telegram — и получи промокод на скидку</p>
            <a
              href={`https://t.me/${tgChannel.replace('@','')}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => setTimeout(() => setSubscribed(true), 1500)}
              className="flex items-center gap-2 px-6 py-3 bg-[#2AABEE] hover:bg-[#1a9ad4] text-white font-bold rounded-xl transition-colors text-base mb-3 shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
              Подписаться на Telegram
            </a>
            <button onClick={() => setSubscribed(true)} className="text-xs text-white/30 hover:text-white/60 transition-colors">Уже подписан</button>
          </>) : (<>
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-3">Твой промокод:</h3>
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-5 py-3 mb-2">
              <span className="text-3xl font-mono font-black tracking-widest text-cyan-300">{promoCode}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(promoCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 transition-colors"
              >
                {copied
                  ? <span className="text-green-400 text-xs font-bold">✓</span>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                }
              </button>
            </div>
            <p className="text-white/55 text-xs mb-5">Введи при оформлении заказа</p>
            <button onClick={() => { startGame(); }} className="text-sm text-white/40 hover:text-white/70 underline transition-colors">Сыграть ещё раз</button>
          </>)}
        </div>
      )}
    </div>
  );
}