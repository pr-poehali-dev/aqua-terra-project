import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  tgChannel: string;
  scoreToWin?: number;
  onWin?: () => void;
}

const SCORE_TO_WIN = 25;
const CANVAS_W = 600;
const CANVAS_H = 360;
const FISH_SIZE = 28;
const FOOD_SIZE = 14;
const FISH_SPEED = 4;
const FOOD_INTERVAL = 1400;
const FOOD_SPEED_BASE = 1.8;

interface Food {
  x: number; y: number; type: 'fish' | 'bubble' | 'star'; vx: number; vy: number; id: number;
}

let foodId = 0;

export default function FishGame({ tgChannel, scoreToWin = SCORE_TO_WIN }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    fishX: CANVAS_W / 2, fishY: CANVAS_H / 2,
    targetX: CANVAS_W / 2, targetY: CANVAS_H / 2,
    foods: [] as Food[],
    score: 0,
    alive: false,
    won: false,
    animId: 0,
    foodTimer: 0,
    lastTime: 0,
  });
  const [phase, setPhase] = useState<'idle' | 'playing' | 'dead' | 'won'>('idle');
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const spawnFood = () => {
    const types: Food['type'][] = ['fish', 'bubble', 'star'];
    const type = types[Math.floor(Math.random() * types.length)];
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0, vx = 0, vy = 0;
    const speed = FOOD_SPEED_BASE + Math.random() * 1.2;
    if (side === 0) { x = Math.random() * CANVAS_W; y = -20; vx = (Math.random()-0.5)*1.5; vy = speed; }
    else if (side === 1) { x = CANVAS_W+20; y = Math.random() * CANVAS_H; vx = -speed; vy = (Math.random()-0.5)*1.5; }
    else if (side === 2) { x = Math.random() * CANVAS_W; y = CANVAS_H+20; vx = (Math.random()-0.5)*1.5; vy = -speed; }
    else { x = -20; y = Math.random() * CANVAS_H; vx = speed; vy = (Math.random()-0.5)*1.5; }
    stateRef.current.foods.push({ x, y, type, vx, vy, id: foodId++ });
  };

  const drawFish = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    // Тело
    ctx.beginPath();
    ctx.ellipse(0, 0, FISH_SIZE, FISH_SIZE * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee';
    ctx.fill();
    // Хвост
    ctx.beginPath();
    ctx.moveTo(-FISH_SIZE, 0);
    ctx.lineTo(-FISH_SIZE - 14, -10);
    ctx.lineTo(-FISH_SIZE - 14, 10);
    ctx.closePath();
    ctx.fillStyle = '#0891b2';
    ctx.fill();
    // Глаз
    ctx.beginPath();
    ctx.arc(FISH_SIZE * 0.5, -4, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(FISH_SIZE * 0.55, -4, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    // Плавник
    ctx.beginPath();
    ctx.moveTo(0, -FISH_SIZE * 0.6);
    ctx.lineTo(-8, -FISH_SIZE * 0.9);
    ctx.lineTo(10, -FISH_SIZE * 0.6);
    ctx.fillStyle = '#67e8f9';
    ctx.fill();
    ctx.restore();
  };

  const drawFood = (ctx: CanvasRenderingContext2D, food: Food) => {
    ctx.save();
    ctx.translate(food.x, food.y);
    if (food.type === 'fish') {
      ctx.font = `${FOOD_SIZE + 4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐠', 0, 0);
    } else if (food.type === 'bubble') {
      ctx.beginPath();
      ctx.arc(0, 0, FOOD_SIZE / 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(125,211,252,0.2)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-3, -3, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
    } else {
      ctx.font = `${FOOD_SIZE + 2}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', 0, 0);
    }
    ctx.restore();
  };

  const loop = useCallback((time: number) => {
    const s = stateRef.current;
    if (!s.alive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const dt = Math.min(time - s.lastTime, 50);
    s.lastTime = time;
    s.foodTimer += dt;
    if (s.foodTimer > FOOD_INTERVAL) { spawnFood(); s.foodTimer = 0; }

    // Двигаем рыбку к курсору
    const dx = s.targetX - s.fishX;
    const dy = s.targetY - s.fishY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 2) {
      s.fishX += (dx / dist) * Math.min(FISH_SPEED, dist);
      s.fishY += (dy / dist) * Math.min(FISH_SPEED, dist);
    }
    const dir = s.targetX >= s.fishX ? 1 : -1;

    // Двигаем еду
    s.foods = s.foods.filter(f => {
      f.x += f.vx; f.y += f.vy;
      return f.x > -40 && f.x < CANVAS_W+40 && f.y > -40 && f.y < CANVAS_H+40;
    });

    // Проверяем съедание
    s.foods = s.foods.filter(f => {
      const d = Math.sqrt((f.x - s.fishX)**2 + (f.y - s.fishY)**2);
      if (d < FISH_SIZE + FOOD_SIZE / 2) {
        s.score += f.type === 'star' ? 3 : 1;
        setScore(s.score);
        if (s.score >= scoreToWin) {
          s.alive = false;
          s.won = true;
          setPhase('won');
          setWon(true);
        }
        return false;
      }
      return true;
    });

    // Рисуем фон
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(1, '#075985');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Пузырьки фона
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 8; i++) {
      const bx = ((i * 137 + time * 0.02) % CANVAS_W);
      const by = ((i * 73 + time * 0.03) % CANVAS_H);
      ctx.beginPath(); ctx.arc(bx, by, 4+i%3, 0, Math.PI*2); ctx.fill();
    }

    // Рисуем еду
    s.foods.forEach(f => drawFood(ctx, f));

    // Рисуем рыбку
    drawFish(ctx, s.fishX, s.fishY, dir);

    // Счёт
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🐟 ${s.score} / ${scoreToWin}`, 14, 28);

    s.animId = requestAnimationFrame(loop);
  }, [scoreToWin]);

  const startGame = () => {
    const s = stateRef.current;
    s.fishX = CANVAS_W / 2; s.fishY = CANVAS_H / 2;
    s.targetX = CANVAS_W / 2; s.targetY = CANVAS_H / 2;
    s.foods = []; s.score = 0; s.alive = true; s.won = false; s.foodTimer = 0;
    s.lastTime = performance.now();
    setScore(0); setPhase('playing'); setWon(false);
    cancelAnimationFrame(s.animId);
    spawnFood();
    s.animId = requestAnimationFrame(loop);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(stateRef.current.animId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    stateRef.current.targetX = (e.clientX - rect.left) * scaleX;
    stateRef.current.targetY = (e.clientY - rect.top) * scaleY;
  };

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const t = e.touches[0];
    stateRef.current.targetX = (t.clientX - rect.left) * scaleX;
    stateRef.current.targetY = (t.clientY - rect.top) * scaleY;
  };

  return (
    <div className="relative w-full" style={{ maxWidth: CANVAS_W }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full rounded-2xl"
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, cursor: phase === 'playing' ? 'none' : 'default', display: 'block' }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
      />

      {/* Idle */}
      {phase === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#075985]/90 text-white text-center p-6">
          <div className="text-5xl mb-4">🐟</div>
          <h3 className="text-2xl font-bold mb-2">Накорми рыбку!</h3>
          <p className="text-white/70 text-sm mb-1">Двигай мышью — рыбка плывёт за курсором</p>
          <p className="text-white/70 text-sm mb-6">Собери <strong className="text-cyan-300">{scoreToWin} очков</strong> — получи промокод</p>
          <div className="flex gap-4 text-xs text-white/60 mb-6">
            <span>🐠 = 1 очко</span>
            <span>🔵 пузырь = 1 очко</span>
            <span>⭐ = 3 очка</span>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-[#0c4a6e] font-bold rounded-xl transition-colors text-base"
          >
            Начать игру
          </button>
        </div>
      )}

      {/* Won */}
      {phase === 'won' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0c4a6e]/95 text-white text-center p-6">
          <div className="text-5xl mb-3">🏆</div>
          <h3 className="text-2xl font-bold mb-1">Ты набрал {score} очков!</h3>
          <p className="text-white/70 text-sm mb-5">Подпишись на наш Telegram-канал и получи промокод на скидку</p>
          <a
            href={`https://t.me/${tgChannel.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-[#2AABEE] hover:bg-[#1a9ad4] text-white font-bold rounded-xl transition-colors text-base mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
            Подписаться на Telegram
          </a>
          <button
            onClick={startGame}
            className="text-sm text-white/50 hover:text-white/80 underline transition-colors"
          >
            Сыграть ещё раз
          </button>
        </div>
      )}
    </div>
  );
}
