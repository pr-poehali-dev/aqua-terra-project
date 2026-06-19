import { useEffect, useRef, useState, useCallback } from 'react';
import { W, H, WIN, Food, Bubble, Weed, mkFood, makeInitialBubbles, makeInitialWeeds } from './fishGameTypes';
import { drawBg, drawBubbles, drawWeeds, drawFlake, drawWorm, drawFish, drawNet } from './fishGameDraw';
import { FishSVG, TrophySVG } from './FishGameSVGs';

export { FishSVG };

interface Props { tgChannel: string; scoreToWin?: number; promoCode?: string; }

export default function FishGame({ tgChannel, scoreToWin = WIN, promoCode = 'AQUA10' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    fishX: W / 2, fishY: H / 2, fishVx: 0, fishVy: 0,
    targetX: W / 2, targetY: H / 2,
    fishAngle: 0, wag: 0, wagDir: 1,
    netX: W - 80, netY: H / 2, netAngle: 0,
    // netX/netY — центр обруча сачка в canvas-координатах
    netLunge: 0,
    netLunging: false,
    netLungeTimer: 0,
    netPauseTimer: 0,
    foods: [] as Food[], score: 0, alive: false,
    dead: false, deadTimer: 0,
    animId: 0, foodTimer: 0, lastTime: 0,
    bubbles: makeInitialBubbles() as Bubble[],
    weeds: makeInitialWeeds() as Weed[],
  });
  const [phase, setPhase] = useState<'idle' | 'playing' | 'won'>('idle');
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const idleAnimRef = useRef(0);

  const idleLoop = useCallback((time: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!; const s = stateRef.current;
    drawBg(ctx, time, s.bubbles); drawWeeds(ctx, s.weeds, time * 0.001); drawBubbles(ctx, s.bubbles);
    const fx = W / 2 + Math.sin(time * 0.0008) * 80, fy = H / 2 + Math.sin(time * 0.0005) * 35;
    drawFish(ctx, fx, fy, Math.sin(time * 0.0008) * 0.35, Math.sin(time * 0.006) * 0.8, 1.3);
    idleAnimRef.current = requestAnimationFrame(idleLoop);
  }, []);

  useEffect(() => {
    if (phase === 'idle') { idleAnimRef.current = requestAnimationFrame(idleLoop); return () => cancelAnimationFrame(idleAnimRef.current); }
  }, [phase, idleLoop]);

  const restartGame = useCallback((keepScore = false) => {
    const s = stateRef.current;
    s.fishX = W / 2; s.fishY = H / 2; s.fishVx = 0; s.fishVy = 0;
    s.targetX = W / 2; s.targetY = H / 2; s.fishAngle = 0; s.wag = 0;
    s.netX = W - 80; s.netY = H / 2; s.netAngle = 0;
    s.netLunge = 0; s.netLunging = false; s.netLungeTimer = 2000; s.netPauseTimer = 0;
    if (!keepScore) { s.score = 0; setScore(0); }
    s.foods = []; s.alive = true; s.dead = false; s.deadTimer = 0;
    s.foodTimer = 0; s.lastTime = performance.now();
    cancelAnimationFrame(s.animId);
    for (let i = 0; i < 5; i++) mkFood(s.foods);
  }, []);

  const gameLoop = useCallback((time: number) => {
    const s = stateRef.current;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    if (pausedRef.current) {
      s.lastTime = time;
      s.animId = requestAnimationFrame(gameLoop); return;
    }

    const dt = Math.min(time - s.lastTime, 50); s.lastTime = time;

    if (s.dead) {
      s.deadTimer += dt * 0.001;
      drawBg(ctx, time, s.bubbles); drawWeeds(ctx, s.weeds, time * 0.001); drawBubbles(ctx, s.bubbles);
      s.foods.forEach(f => f.type === 'flake' ? drawFlake(ctx, f.x, f.y, f.angle) : drawWorm(ctx, f.x, f.y, f.wobble, f.vx, f.vy));
      drawNet(ctx, s.netX, s.netY, s.netAngle, 1);
      drawFish(ctx, s.fishX, s.fishY, s.fishAngle, s.wag, 1, true, s.deadTimer);
      ctx.save(); ctx.globalAlpha = Math.min(1, s.deadTimer * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(W / 2 - 135, H / 2 - 32, 270, 64, 12);
      else ctx.rect(W / 2 - 135, H / 2 - 32, 270, 64);
      ctx.fill();
      ctx.strokeStyle = 'rgba(239,68,68,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 19px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Аквариумист поймал рыбку!', W / 2, H / 2 - 8);
      ctx.font = '13px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText('Начинаем заново...', W / 2, H / 2 + 16); ctx.restore();
      if (s.deadTimer > 2) { restartGame(false); s.animId = requestAnimationFrame(gameLoop); return; }
      s.animId = requestAnimationFrame(gameLoop); return;
    }

    if (!s.alive) return;

    s.foodTimer += dt;
    if (s.foodTimer > 480) { mkFood(s.foods); if (s.foods.length < 3) mkFood(s.foods); s.foodTimer = 0; }

    // Рыбка
    const dx = s.targetX - s.fishX, dy = s.targetY - s.fishY;
    s.fishVx = (s.fishVx + dx * 0.018) * 0.82; s.fishVy = (s.fishVy + dy * 0.018) * 0.82;
    s.fishX = Math.max(26, Math.min(W - 26, s.fishX + s.fishVx));
    s.fishY = Math.max(16, Math.min(H - 16, s.fishY + s.fishVy));
    const spd = Math.sqrt(s.fishVx ** 2 + s.fishVy ** 2);
    if (spd > 0.5) s.fishAngle = Math.atan2(s.fishVy, s.fishVx);
    s.wag += s.wagDir * 0.14 * (0.5 + spd * 0.25); if (Math.abs(s.wag) > 1) s.wagDir *= -1;

    // Сачок — netX/netY это центр обруча в canvas-координатах
    // В покое сачок «висит» в правой части экрана на уровне рыбки
    // При броске резко движется к рыбке
    const pivotX = W + 20, pivotY = -30;
    const armLen = Math.sqrt((s.netX - pivotX) ** 2 + (s.netY - pivotY) ** 2);
    const ndist = Math.sqrt((s.fishX - s.netX) ** 2 + (s.fishY - s.netY) ** 2);

    // Целевая точка покоя: правее рыбки, на том же уровне по Y
    const restX = Math.min(W - 60, s.fishX + 120);
    const restY = s.fishY;
    // Целевая точка броска: прямо на рыбку
    const lungeTargetX = s.fishX;
    const lungeTargetY = s.fishY;

    if (s.netPauseTimer > 0) {
      s.netPauseTimer -= dt;
      s.netLunge = Math.max(0, s.netLunge - dt * 0.005);
      // Плавно возвращаемся в покой
      s.netX += (restX - s.netX) * 0.035;
      s.netY += (restY - s.netY) * 0.035;
    } else if (s.netLunging) {
      s.netLunge = Math.min(1, s.netLunge + dt * 0.006);
      // Быстро летим к рыбке
      s.netX += (lungeTargetX - s.netX) * 0.09;
      s.netY += (lungeTargetY - s.netY) * 0.09;
      if (s.netLunge >= 1) { s.netLunging = false; s.netPauseTimer = 1200; }
    } else {
      s.netLungeTimer -= dt;
      s.netLunge *= 0.88;
      // Лениво следим за рыбкой в покое
      s.netX += (restX - s.netX) * 0.03;
      s.netY += (restY - s.netY) * 0.03;
      if (s.netLungeTimer <= 0) {
        s.netLunging = true;
        s.netLungeTimer = 2200 + Math.random() * 2000;
      }
    }

    // Ограничиваем чтобы ручка не стала слишком короткой/длинной
    const minArm = 120, maxArm = 340;
    const curLen = Math.sqrt((s.netX - pivotX) ** 2 + (s.netY - pivotY) ** 2);
    if (curLen < minArm || curLen > maxArm) {
      const clamp = Math.max(minArm, Math.min(maxArm, curLen));
      const ang = Math.atan2(s.netY - pivotY, s.netX - pivotX);
      s.netX = pivotX + Math.cos(ang) * clamp;
      s.netY = pivotY + Math.sin(ang) * clamp;
    }

    // Поймал: рыбка вошла в обруч сачка — всегда, независимо от фазы броска
    const catchRadius = 58;
    if (ndist < catchRadius) {
      s.alive = false; s.dead = true; s.deadTimer = 0;
      s.animId = requestAnimationFrame(gameLoop); return;
    }
    void armLen;

    // Еда
    s.foods.forEach(f => { f.x += f.vx; f.y += f.vy; f.wobble += 0.12; f.angle += 0.015; });
    s.foods = s.foods.filter(f => f.x > -30 && f.x < W + 30 && f.y > -30 && f.y < H + 30);
    s.foods = s.foods.filter(f => {
      const d = Math.sqrt((f.x - s.fishX) ** 2 + (f.y - s.fishY) ** 2);
      if (d < (f.type === 'worm' ? 38 : 30)) {
        s.score += f.type === 'worm' ? 2 : 1; setScore(s.score);
        if (s.score >= scoreToWin) { s.alive = false; setPhase('won'); }
        return false;
      }
      return true;
    });

    drawBg(ctx, time, s.bubbles);
    drawWeeds(ctx, s.weeds, time * 0.001);
    drawBubbles(ctx, s.bubbles);
    s.foods.forEach(f => f.type === 'flake' ? drawFlake(ctx, f.x, f.y, f.angle) : drawWorm(ctx, f.x, f.y, f.wobble, f.vx, f.vy));
    drawNet(ctx, s.netX, s.netY, s.netAngle, s.netLunge);
    drawFish(ctx, s.fishX, s.fishY, s.fishAngle, s.wag);

    // HUD счёт
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, 115, 30, 8); else ctx.rect(8, 8, 115, 30);
    ctx.fill();
    drawFlake(ctx, 24, 23, time * 0.001);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${s.score} / ${scoreToWin}`, 38, 28);

    // Предупреждение о броске
    if (s.netLunging && s.netLunge > 0.3) {
      ctx.save(); ctx.globalAlpha = s.netLunge * 0.8;
      ctx.fillStyle = `rgba(251,191,36,${s.netLunge * 0.1})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = Math.min(1, s.netLunge * 2);
      ctx.fillStyle = 'rgba(251,191,36,0.95)'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⚠ Аквариумист бросает сачок!', W / 2, 20); ctx.restore();
    }

    s.animId = requestAnimationFrame(gameLoop);
  }, [scoreToWin, restartGame]);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(p => !p);
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(idleAnimRef.current);
    pausedRef.current = false; setPaused(false);
    restartGame(false);
    setPhase('playing'); setSubscribed(false); setCopied(false);
    const s = stateRef.current;
    s.animId = requestAnimationFrame(gameLoop);
  }, [restartGame, gameLoop]);

  useEffect(() => () => { cancelAnimationFrame(stateRef.current.animId); cancelAnimationFrame(idleAnimRef.current); }, []);

  const onMove = (cx: number, cy: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    stateRef.current.targetX = (cx - r.left) * (W / r.width);
    stateRef.current.targetY = (cy - r.top) * (H / r.height);
  };

  return (
    <div className="relative w-full" style={{ maxWidth: W }}>
      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl block"
        style={{ aspectRatio: `${W}/${H}`, cursor: phase === 'playing' && !paused ? 'crosshair' : 'default' }}
        onMouseMove={e => { if (!paused) onMove(e.clientX, e.clientY); }}
        onTouchMove={e => { e.preventDefault(); if (!paused) onMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchStart={e => { e.preventDefault(); if (!paused) onMove(e.touches[0].clientX, e.touches[0].clientY); }}
      />

      {/* Кнопка паузы */}
      {phase === 'playing' && (
        <button
          onClick={togglePause}
          className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors text-white"
        >
          {paused
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          }
        </button>
      )}

      {/* Оверлей паузы */}
      {phase === 'playing' && paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl" style={{ background: 'rgba(8,47,73,0.82)', backdropFilter: 'blur(4px)' }}>
          <div className="text-5xl mb-3">⏸</div>
          <h3 className="text-2xl font-bold text-white mb-4">Пауза</h3>
          <button onClick={togglePause} className="px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-[#0c4a6e] font-bold rounded-xl transition-colors text-base shadow-lg">
            Продолжить
          </button>
        </div>
      )}

      {phase === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-end justify-end rounded-2xl p-6 pb-8">
          <div className="w-full flex flex-col items-center">
            <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">Накорми рыбку!</h3>
            <p className="text-white/70 text-sm mb-1">Веди мышью — рыбка плывёт следом</p>
            <p className="text-white/70 text-sm mb-1">Собери <strong className="text-cyan-300">{scoreToWin} очков</strong> — получи промокод</p>
            <p className="text-yellow-300/80 text-xs mb-4">Осторожно — аквариумист иногда бросает сачок!</p>
            <div className="flex gap-5 text-xs text-white/60 mb-5">
              <span>✦ хлопья = 1 очко</span><span>● червяк = 2 очка</span>
            </div>
            <button onClick={startGame} className="px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-[#0c4a6e] font-bold rounded-xl transition-colors text-base shadow-xl">
              Начать игру
            </button>
          </div>
        </div>
      )}

      {phase === 'won' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl text-white text-center p-6" style={{ background: 'linear-gradient(160deg,#0c4a6e 0%,#082f49 100%)' }}>
          {!subscribed ? (<>
            <TrophySVG size={64}/>
            <h3 className="text-2xl font-bold mt-3 mb-1">Ты набрал {score} очков!</h3>
            <p className="text-white/70 text-sm mb-5">Подпишись на Telegram — и получи промокод</p>
            <a href={`https://t.me/${tgChannel.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              onClick={() => setTimeout(() => setSubscribed(true), 1500)}
              className="flex items-center gap-2 px-6 py-3 bg-[#2AABEE] hover:bg-[#1a9ad4] text-white font-bold rounded-xl transition-colors mb-3 shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
              Подписаться на Telegram
            </a>
            <button onClick={() => setSubscribed(true)} className="text-xs text-white/30 hover:text-white/60 transition-colors">Уже подписан</button>
          </>) : (<>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400/40 mb-3">
              <FishSVG size={40}/>
            </div>
            <h3 className="text-xl font-bold mb-3">Твой промокод:</h3>
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-5 py-3 mb-2">
              <span className="text-3xl font-mono font-black tracking-widest text-cyan-300">{promoCode}</span>
              <button onClick={() => { navigator.clipboard.writeText(promoCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 transition-colors">
                {copied
                  ? <span className="text-green-400 text-xs font-bold">✓</span>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                }
              </button>
            </div>
            <p className="text-white/55 text-xs mb-5">Введи при оформлении заказа</p>
            <button onClick={startGame} className="text-sm text-white/40 hover:text-white/70 underline transition-colors">Сыграть ещё раз</button>
          </>)}
        </div>
      )}
    </div>
  );
}