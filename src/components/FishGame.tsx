import { useEffect, useRef, useState, useCallback } from 'react';

interface Props { tgChannel: string; scoreToWin?: number; promoCode?: string; }

const W = 600, H = 360, WIN = 25;

interface Food { x:number;y:number;vx:number;vy:number;type:'flake'|'worm';id:number;angle:number;wobble:number; }
interface Bubble { x:number;y:number;r:number;speed:number;op:number;wobble:number; }
interface Weed { x:number;segments:number;totalH:number;color:string;phase:number;speed:number; }

let _id = 0;
function mkFood(foods:Food[]) {
  const type:Food['type']=Math.random()>0.38?'flake':'worm';
  const side=Math.floor(Math.random()*4);
  let x=0,y=0,vx=0,vy=0;
  const spd=1.6+Math.random()*2;
  if(side===0){x=40+Math.random()*(W-80);y=-16;vx=(Math.random()-.5)*1.2;vy=spd;}
  else if(side===1){x=W+16;y=20+Math.random()*(H-40);vx=-spd;vy=(Math.random()-.5)*1.2;}
  else if(side===2){x=40+Math.random()*(W-80);y=H+16;vx=(Math.random()-.5)*1.2;vy=-spd;}
  else{x=-16;y=20+Math.random()*(H-40);vx=spd;vy=(Math.random()-.5)*1.2;}
  foods.push({x,y,vx,vy,type,id:_id++,angle:Math.random()*Math.PI*2,wobble:Math.random()*Math.PI*2});
}

function drawFlake(ctx:CanvasRenderingContext2D,x:number,y:number,t:number) {
  ctx.save();ctx.translate(x,y);ctx.rotate(t*0.4);
  for(let i=0;i<6;i++){
    ctx.save();ctx.rotate(i/6*Math.PI*2);
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-7);
    ctx.strokeStyle='rgba(255,215,100,0.9)';ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-2.8);ctx.lineTo(2.5,-4.5);ctx.moveTo(0,-2.8);ctx.lineTo(-2.5,-4.5);
    ctx.strokeStyle='rgba(255,215,100,0.6)';ctx.lineWidth=1.2;ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);
  ctx.fillStyle='rgba(255,240,160,0.95)';ctx.fill();ctx.restore();
}

function drawWorm(ctx:CanvasRenderingContext2D,x:number,y:number,wobble:number,vx:number,vy:number) {
  const baseAngle=Math.atan2(vy,vx)+Math.PI/2;
  ctx.save();ctx.translate(x,y);ctx.rotate(baseAngle);
  for(let i=0;i<6;i++){
    const ox=Math.sin(wobble+i*1.1)*3.5,oy=i*5;
    const r=i===0?4.5:Math.max(4.5-i*0.5,2);
    const g=ctx.createRadialGradient(ox,oy,0,ox,oy,r);
    if(i===0){g.addColorStop(0,'#ff7043');g.addColorStop(1,'#e64a19');}
    else{g.addColorStop(0,'#a5d6a7');g.addColorStop(1,'#66bb6a');}
    ctx.beginPath();ctx.arc(ox,oy,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    if(i>0&&i%2===0){ctx.beginPath();ctx.arc(ox,oy,r,0,Math.PI*2);ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;ctx.stroke();}
    if(i===0){
      ctx.beginPath();ctx.arc(ox-1.8,oy-1.5,1.4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
      ctx.beginPath();ctx.arc(ox-1.8,oy-1.5,0.7,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
      ctx.beginPath();ctx.arc(ox+1.8,oy-1.5,1.4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
      ctx.beginPath();ctx.arc(ox+1.8,oy-1.5,0.7,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
    }
  }
  ctx.restore();
}

function drawFish(ctx:CanvasRenderingContext2D,x:number,y:number,angle:number,wag:number,scale=1,dead=false,deadT=0) {
  ctx.save();ctx.translate(x,y);
  if(dead){ctx.rotate(angle+deadT*4);ctx.globalAlpha=Math.max(0,1-deadT*1.5);}
  else ctx.rotate(angle);
  ctx.scale(scale,scale);
  // Хвост
  ctx.beginPath();ctx.moveTo(-20,0);
  ctx.bezierCurveTo(-32,-13+wag*10,-42,-11+wag*15,-40,wag*7);
  ctx.bezierCurveTo(-42,11+wag*15,-32,13+wag*10,-20,0);ctx.closePath();
  const tg=ctx.createLinearGradient(-42,0,-20,0);
  tg.addColorStop(0,dead?'#555':'#0369a1');tg.addColorStop(1,dead?'#777':'#0ea5e9');
  ctx.fillStyle=tg;ctx.fill();
  // Тело
  ctx.beginPath();ctx.ellipse(0,0,24,12,0,0,Math.PI*2);
  const bg=ctx.createLinearGradient(-24,-12,24,12);
  bg.addColorStop(0,dead?'#6b7280':'#38bdf8');bg.addColorStop(0.4,dead?'#4b5563':'#0ea5e9');bg.addColorStop(1,dead?'#374151':'#0369a1');
  ctx.fillStyle=bg;ctx.fill();
  ctx.beginPath();ctx.ellipse(2,4,18,7,0.15,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fill();
  // Плавники
  ctx.beginPath();ctx.moveTo(-8,-12);ctx.bezierCurveTo(-4,-22,9,-21,14,-12);ctx.closePath();
  ctx.fillStyle=dead?'rgba(100,100,100,0.7)':'rgba(14,165,233,0.75)';ctx.fill();
  ctx.beginPath();ctx.moveTo(2,10);ctx.bezierCurveTo(5,18,13,20,14,10);ctx.closePath();
  ctx.fillStyle=dead?'rgba(100,100,100,0.6)':'rgba(56,189,248,0.6)';ctx.fill();
  // Чешуя
  for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(-10+i*9,-1,6,4,-0.2,Math.PI,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=0.9;ctx.stroke();}
  ctx.beginPath();ctx.moveTo(-16,0);ctx.bezierCurveTo(-4,-5,8,-4,20,0);ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1.5;ctx.stroke();
  // Глаз
  ctx.beginPath();ctx.arc(15,-3,5.5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  ctx.beginPath();ctx.arc(16,-3,3.5,0,Math.PI*2);
  const eg=ctx.createRadialGradient(16,-3,0,16,-3,3.5);
  eg.addColorStop(0,dead?'#555':'#1e3a5f');eg.addColorStop(1,dead?'#333':'#0c1f35');
  ctx.fillStyle=eg;ctx.fill();
  if(!dead){ctx.beginPath();ctx.arc(17,-4,1.2,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fill();}
  else{ctx.strokeStyle='#777';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(13,-5);ctx.lineTo(17,-1);ctx.moveTo(17,-5);ctx.lineTo(13,-1);ctx.stroke();}
  ctx.beginPath();ctx.arc(23,2,3.5,0.3,Math.PI*0.85);
  ctx.strokeStyle=dead?'rgba(80,80,80,0.8)':'rgba(3,105,161,0.8)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();
}

// Сачок аквариумиста в профиль — зачерпывающее движение по дуге
// lunge: 0=покой (сачок справа-сверху), 1=конец броска (сачок под рыбкой)
function drawNet(ctx:CanvasRenderingContext2D,x:number,y:number,_angle:number,lunge:number) {
  // Pivot — точка вращения (правый верхний угол, где рука)
  // Сачок описывает дугу: от ~-40° (покой, справа) до ~30° (бросок, снизу)
  const pivotX = x + 90;          // рука всегда правее рыбки
  const pivotY = y - 60;           // и выше
  const armLen = 95;               // длина ручки
  const sweepAngle = (-Math.PI*0.42) + lunge * (Math.PI*0.72); // дуга броска

  // Конец ручки (где крепится сачок)
  const netTipX = pivotX + Math.cos(sweepAngle) * armLen;
  const netTipY = pivotY + Math.sin(sweepAngle) * armLen;

  // Угол сачка — перпендикулярен ручке, открыт вперёд
  const netFaceAngle = sweepAngle + Math.PI * 0.5;

  // ── РУЧКА ──────────────────────────────────────────────────────────────
  ctx.save();
  // Основной стержень
  ctx.beginPath();ctx.moveTo(netTipX,netTipY);ctx.lineTo(pivotX,pivotY);
  ctx.strokeStyle='#334155';ctx.lineWidth=6;ctx.lineCap='round';ctx.stroke();
  // Витая текстура
  for(let i=1;i<12;i++){
    const t=i/12;
    const hx=netTipX+(pivotX-netTipX)*t;
    const hy=netTipY+(pivotY-netTipY)*t;
    const perp=sweepAngle+Math.PI/2;
    const off=(i%2===0)?-3:3;
    ctx.beginPath();ctx.moveTo(hx+Math.cos(perp)*off,hy+Math.sin(perp)*off);
    ctx.lineTo(hx+Math.cos(perp)*(off+0.5),hy+Math.sin(perp)*(off+0.5));
    ctx.strokeStyle='#1e293b';ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();
  }
  ctx.restore();

  // ── РУКА (держит ручку у pivot) ────────────────────────────────────────
  ctx.save();ctx.translate(pivotX, pivotY);
  // Рукав (уходит за правый край/верх)
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(28,-22);
  ctx.strokeStyle='#1d4ed8';ctx.lineWidth=20;ctx.lineCap='round';ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(28,-22);
  ctx.strokeStyle='#2563eb';ctx.lineWidth=16;ctx.lineCap='round';ctx.stroke();
  // Манжета
  ctx.beginPath();ctx.ellipse(0,0,14,10,sweepAngle+0.3,0,Math.PI*2);
  ctx.fillStyle='#e8a87c';ctx.fill();
  ctx.strokeStyle='#c8875a';ctx.lineWidth=1;ctx.stroke();
  // Ладонь (в профиль — вытянутая форма)
  ctx.beginPath();
  ctx.moveTo(-6,-8);ctx.bezierCurveTo(-10,-4,-10,8,-4,12);
  ctx.bezierCurveTo(4,16,12,10,12,2);ctx.bezierCurveTo(12,-6,6,-12,-6,-8);
  ctx.fillStyle='#fcd5a8';ctx.fill();ctx.strokeStyle='#c8875a';ctx.lineWidth=1;ctx.stroke();
  // Пальцы (в профиль, загнуты вокруг ручки)
  for(let f=0;f<4;f++){
    ctx.beginPath();ctx.ellipse(-8+f*2, -6+f*4, 4, 3, 0.8, 0, Math.PI*2);
    ctx.fillStyle='#fcd5a8';ctx.fill();ctx.strokeStyle='#c8875a';ctx.lineWidth=0.7;ctx.stroke();
  }
  // Большой палец
  ctx.beginPath();ctx.ellipse(8,-2,5,3,-0.4,0,Math.PI*2);
  ctx.fillStyle='#fcd5a8';ctx.fill();ctx.strokeStyle='#c8875a';ctx.lineWidth=0.7;ctx.stroke();
  ctx.restore();

  // ── КВАДРАТНАЯ РАМКА САЧКА в профиль ───────────────────────────────────
  ctx.save();ctx.translate(netTipX, netTipY);ctx.rotate(netFaceAngle);

  const fw=26, fh=22; // ширина и высота рамки

  // Мешок сетки (сзади рамки, провисает)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-fw,0);
  ctx.bezierCurveTo(-fw+4,fh+8+lunge*10, fw-4,fh+8+lunge*10, fw,0);
  ctx.lineTo(fw,0);ctx.lineTo(-fw,0);
  ctx.fillStyle='rgba(15,40,90,0.55)';ctx.fill();
  // Сетка поверх мешка
  ctx.beginPath();
  ctx.moveTo(-fw,0);
  ctx.bezierCurveTo(-fw+4,fh+8+lunge*10, fw-4,fh+8+lunge*10, fw,0);
  ctx.strokeStyle='rgba(30,70,160,0.5)';ctx.lineWidth=1.5;ctx.stroke();
  // Нити сетки
  for(let i=1;i<5;i++){
    const t=i/5;
    const mx=-fw+(fw*2)*t;
    const my=fh*(Math.sin(t*Math.PI)*0.5)*(1+lunge*0.5)+lunge*8;
    ctx.beginPath();ctx.moveTo(mx,0);ctx.lineTo(mx-2,my+5);
    ctx.strokeStyle='rgba(30,80,180,0.35)';ctx.lineWidth=1;ctx.stroke();
  }
  ctx.restore();

  // Рамка
  ctx.beginPath();ctx.rect(-fw,-4,fw*2,8);
  const fg=ctx.createLinearGradient(-fw,0,fw,0);
  fg.addColorStop(0,'#334155');fg.addColorStop(0.5,'#475569');fg.addColorStop(1,'#334155');
  ctx.fillStyle=fg;ctx.fill();
  ctx.strokeStyle='#1e293b';ctx.lineWidth=1;ctx.stroke();
  // Блик на рамке
  ctx.beginPath();ctx.moveTo(-fw,-2);ctx.lineTo(fw,-2);
  ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=1.5;ctx.stroke();

  // Боковые стойки рамки
  ctx.beginPath();
  ctx.moveTo(-fw,-4);ctx.lineTo(-fw+2,fh*0.6+lunge*8);
  ctx.moveTo(fw,-4);ctx.lineTo(fw-2,fh*0.6+lunge*8);
  ctx.strokeStyle='#475569';ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();

  // Передняя грань рамки (ближняя к зрителю)
  ctx.beginPath();ctx.rect(-fw,0,fw*2,6);
  ctx.fillStyle='#64748b';ctx.fill();
  ctx.strokeStyle='#334155';ctx.lineWidth=1;ctx.stroke();

  ctx.restore();
}

function drawWeeds(ctx:CanvasRenderingContext2D,weeds:Weed[],time:number) {
  weeds.forEach(w=>{
    const segH=w.totalH/w.segments;
    ctx.save();ctx.translate(w.x,H);
    let px=0,py=0;
    for(let i=0;i<w.segments;i++){
      const sway=Math.sin(time*w.speed+w.phase+i*0.5)*((i+1)*4);
      const ny=-(i+1)*segH;
      ctx.beginPath();ctx.moveTo(px,py);
      ctx.bezierCurveTo(px+sway*0.5+6,py-segH*0.3,sway-6,ny+segH*0.3,sway,ny);
      ctx.strokeStyle=w.color;ctx.lineWidth=Math.max(1,3-i*0.4);ctx.lineCap='round';ctx.stroke();
      if(i===w.segments-1){
        ctx.beginPath();ctx.ellipse(sway,ny,5,12,Math.sin(time*w.speed+w.phase+i)*0.5+0.2,0,Math.PI*2);
        ctx.fillStyle=w.color;ctx.globalAlpha=0.65;ctx.fill();ctx.globalAlpha=1;
      }
      px=sway;py=ny;
    }
    ctx.restore();
  });
}

function drawBg(ctx:CanvasRenderingContext2D,time:number,bubbles:Bubble[]) {
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0c4a6e');bg.addColorStop(1,'#082f49');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // дно
  ctx.fillStyle='rgba(5,25,45,0.7)';ctx.fillRect(0,H-22,W,22);
  ctx.fillStyle='rgba(8,37,60,0.4)';ctx.fillRect(0,H-34,W,14);
  // каустики
  ctx.globalAlpha=0.035;ctx.fillStyle='#7dd3fc';
  for(let i=0;i<5;i++){
    const cx=((i*173+time*0.007)%W),cy=((i*97+time*0.004)%(H*0.55));
    ctx.beginPath();ctx.ellipse(cx,cy,40+i*8,7,Math.sin(time*0.001+i)*0.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawBubbles(ctx:CanvasRenderingContext2D,bubbles:Bubble[]) {
  bubbles.forEach(b=>{
    b.y-=b.speed;b.wobble+=0.03;b.x+=Math.sin(b.wobble)*0.35;
    if(b.y<-b.r){b.y=H+b.r;b.x=Math.random()*W;}
    ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
    ctx.strokeStyle=`rgba(125,211,252,${b.op})`;ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.arc(b.x-b.r*0.3,b.y-b.r*0.3,b.r*0.28,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${b.op*0.7})`;ctx.fill();
  });
}

// SVG рыбка для плашки (экспортируем)
export function FishSVG({size=32,className=''}:{size?:number;className?:string}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 40" fill="none" className={className}>
      <path d="M8 20 C2 10 2 4 8 8 C2 14 2 26 8 32 C2 36 2 30 8 20Z" fill="#0369a1"/>
      <defs><linearGradient id="fbg" x1="12" y1="8" x2="60" y2="32"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0284c7"/></linearGradient></defs>
      <ellipse cx="36" cy="20" rx="24" ry="12" fill="url(#fbg)"/>
      <ellipse cx="38" cy="24" rx="18" ry="7" fill="rgba(255,255,255,0.15)"/>
      <path d="M28 8 C30 0 44 0 46 8Z" fill="#0ea5e9" opacity="0.8"/>
      <circle cx="52" cy="16" r="5" fill="white"/>
      <circle cx="53" cy="16" r="3" fill="#1e3a5f"/>
      <circle cx="54" cy="15" r="1" fill="white" opacity="0.9"/>
      <path d="M60 18 Q63 20 60 22" stroke="#0369a1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function TrophySVG({size=56}:{size?:number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="20" y="52" width="24" height="5" rx="2" fill="#b45309"/>
      <rect x="16" y="57" width="32" height="5" rx="2.5" fill="#92400e"/>
      <rect x="28" y="44" width="8" height="10" fill="#ca8a04"/>
      <defs><linearGradient id="tgg" x1="12" y1="8" x2="52" y2="48"><stop stopColor="#fde68a"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
      <path d="M12 8 H52 V30 C52 42 44 48 32 48 C20 48 12 42 12 30 Z" fill="url(#tgg)"/>
      <path d="M12 12 C4 12 4 28 12 28" stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M52 12 C60 12 60 28 52 28" stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M24 24 L28 36 L32 28 L36 36 L40 24" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function FishGame({tgChannel,scoreToWin=WIN,promoCode='AQUA10'}:Props) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const stateRef=useRef({
    fishX:W/2,fishY:H/2,fishVx:0,fishVy:0,
    targetX:W/2,targetY:H/2,
    fishAngle:0,wag:0,wagDir:1,
    // Сачок
    netX:W+80,netY:H/2,netAngle:0,
    netLunge:0,          // 0..1 — бросок сачка вперёд
    netLunging:false,    // активный бросок
    netLungeTimer:0,     // таймер до следующего броска
    netPauseTimer:0,     // пауза после броска
    foods:[] as Food[],score:0,alive:false,
    dead:false,deadTimer:0,
    animId:0,foodTimer:0,lastTime:0,
    bubbles:Array.from({length:18},()=>({x:Math.random()*W,y:Math.random()*H,r:1.5+Math.random()*3.5,speed:0.15+Math.random()*0.3,op:0.05+Math.random()*0.08,wobble:Math.random()*Math.PI*2})) as Bubble[],
    weeds:Array.from({length:10},(_,i)=>({
      x:20+i*(W-40)/9,
      segments:2+Math.floor(Math.random()*4),
      totalH: H*(0.10 + Math.random()*0.50), // от 10% до 60% высоты экрана
      color:`rgba(${20+Math.floor(Math.random()*30)},${90+Math.floor(Math.random()*80)},${25+Math.floor(Math.random()*35)},0.8)`,
      phase:Math.random()*Math.PI*2,speed:0.3+Math.random()*0.5,
    })) as Weed[],
  });
  const [phase,setPhase]=useState<'idle'|'playing'|'won'>('idle');
  const [score,setScore]=useState(0);
  const [subscribed,setSubscribed]=useState(false);
  const [copied,setCopied]=useState(false);
  const idleAnimRef=useRef(0);

  const idleLoop=useCallback((time:number)=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d')!;const s=stateRef.current;
    drawBg(ctx,time,s.bubbles);drawWeeds(ctx,s.weeds,time*0.001);drawBubbles(ctx,s.bubbles);
    const fx=W/2+Math.sin(time*0.0008)*80,fy=H/2+Math.sin(time*0.0005)*35;
    drawFish(ctx,fx,fy,Math.sin(time*0.0008)*0.35,Math.sin(time*0.006)*0.8,1.3);
    idleAnimRef.current=requestAnimationFrame(idleLoop);
  },[]);

  useEffect(()=>{
    if(phase==='idle'){idleAnimRef.current=requestAnimationFrame(idleLoop);return()=>cancelAnimationFrame(idleAnimRef.current);}
  },[phase,idleLoop]);

  const restartGame=useCallback((keepScore=false)=>{
    const s=stateRef.current;
    s.fishX=W/2;s.fishY=H/2;s.fishVx=0;s.fishVy=0;
    s.targetX=W/2;s.targetY=H/2;s.fishAngle=0;s.wag=0;
    s.netX=W*0.6;s.netY=H*0.4;s.netAngle=0;
    s.netLunge=0;s.netLunging=false;s.netLungeTimer=3500;s.netPauseTimer=0;
    if(!keepScore){s.score=0;setScore(0);}
    s.foods=[];s.alive=true;s.dead=false;s.deadTimer=0;
    s.foodTimer=0;s.lastTime=performance.now();
    cancelAnimationFrame(s.animId);
    for(let i=0;i<5;i++)mkFood(s.foods);
  },[]);

  const gameLoop=useCallback((time:number)=>{
    const s=stateRef.current;
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d')!;
    const dt=Math.min(time-s.lastTime,50);s.lastTime=time;

    if(s.dead){
      s.deadTimer+=dt*0.001;
      drawBg(ctx,time,s.bubbles);drawWeeds(ctx,s.weeds,time*0.001);drawBubbles(ctx,s.bubbles);
      s.foods.forEach(f=>f.type==='flake'?drawFlake(ctx,f.x,f.y,f.angle):drawWorm(ctx,f.x,f.y,f.wobble,f.vx,f.vy));
      drawNet(ctx,s.netX,s.netY,s.netAngle,1);
      drawFish(ctx,s.fishX,s.fishY,s.fishAngle,s.wag,1,true,s.deadTimer);
      ctx.save();ctx.globalAlpha=Math.min(1,s.deadTimer*2);
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();
      if(ctx.roundRect)ctx.roundRect(W/2-135,H/2-32,270,64,12);
      else ctx.rect(W/2-135,H/2-32,270,64);
      ctx.fill();
      ctx.strokeStyle='rgba(239,68,68,0.7)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#fff';ctx.font='bold 19px sans-serif';ctx.textAlign='center';
      ctx.fillText('Аквариумист поймал рыбку!',W/2,H/2-8);
      ctx.font='13px sans-serif';ctx.fillStyle='rgba(255,255,255,0.65)';
      ctx.fillText('Начинаем заново...',W/2,H/2+16);ctx.restore();
      if(s.deadTimer>2){restartGame(false);s.animId=requestAnimationFrame(gameLoop);return;}
      s.animId=requestAnimationFrame(gameLoop);return;
    }

    if(!s.alive)return;

    s.foodTimer+=dt;
    if(s.foodTimer>480){mkFood(s.foods);if(s.foods.length<3)mkFood(s.foods);s.foodTimer=0;}

    // Рыбка
    const dx=s.targetX-s.fishX,dy=s.targetY-s.fishY;
    s.fishVx=(s.fishVx+dx*0.018)*0.82;s.fishVy=(s.fishVy+dy*0.018)*0.82;
    s.fishX=Math.max(26,Math.min(W-26,s.fishX+s.fishVx));
    s.fishY=Math.max(16,Math.min(H-16,s.fishY+s.fishVy));
    const spd=Math.sqrt(s.fishVx**2+s.fishVy**2);
    if(spd>0.5)s.fishAngle=Math.atan2(s.fishVy,s.fishVx);
    s.wag+=s.wagDir*0.14*(0.5+spd*0.25);if(Math.abs(s.wag)>1)s.wagDir*=-1;

    // Сачок — pivot следит за рыбкой, бросок по дуге
    // netX/netY = позиция рыбки на момент броска (цель дуги)
    const ndx=s.fishX-s.netX, ndy=s.fishY-s.netY;
    const ndist=Math.sqrt(ndx**2+ndy**2);

    if(s.netPauseTimer>0){
      s.netPauseTimer-=dt;
      s.netLunge=Math.max(0,s.netLunge-dt*0.003);
      // Следим за рыбкой пока отдыхаем
      s.netX+=(s.fishX-s.netX)*0.008;
      s.netY+=(s.fishY-s.netY)*0.008;
    } else if(s.netLunging){
      // Бросок — lunge растёт, pivot летит к рыбке
      s.netLunge=Math.min(1,s.netLunge+dt*0.004);
      s.netX+=(s.fishX-s.netX)*0.05;
      s.netY+=(s.fishY-s.netY)*0.05;
      if(s.netLunge>=1){s.netLunging=false;s.netPauseTimer=2200;}
    } else {
      s.netLungeTimer-=dt;
      s.netLunge*=0.9;
      s.netX+=(s.fishX-s.netX)*0.012;
      s.netY+=(s.fishY-s.netY)*0.012;
      if(s.netLungeTimer<=0){
        s.netLunging=true;
        s.netLungeTimer=4000+Math.random()*4000;
      }
    }

    // Поймал — только в конце дуги и близко
    if(s.netLunging&&s.netLunge>0.6&&ndist<55){
      s.alive=false;s.dead=true;s.deadTimer=0;
      s.animId=requestAnimationFrame(gameLoop);return;
    }

    // Еда
    s.foods.forEach(f=>{f.x+=f.vx;f.y+=f.vy;f.wobble+=0.12;f.angle+=0.015;});
    s.foods=s.foods.filter(f=>f.x>-30&&f.x<W+30&&f.y>-30&&f.y<H+30);
    s.foods=s.foods.filter(f=>{
      const d=Math.sqrt((f.x-s.fishX)**2+(f.y-s.fishY)**2);
      if(d<(f.type==='worm'?38:30)){
        s.score+=f.type==='worm'?2:1;setScore(s.score);
        if(s.score>=scoreToWin){s.alive=false;setPhase('won');}
        return false;
      }
      return true;
    });

    drawBg(ctx,time,s.bubbles);
    drawWeeds(ctx,s.weeds,time*0.001);
    drawBubbles(ctx,s.bubbles);
    s.foods.forEach(f=>f.type==='flake'?drawFlake(ctx,f.x,f.y,f.angle):drawWorm(ctx,f.x,f.y,f.wobble,f.vx,f.vy));
    drawNet(ctx,s.netX,s.netY,s.netAngle,s.netLunge);
    drawFish(ctx,s.fishX,s.fishY,s.fishAngle,s.wag);

    // HUD счёт
    ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(8,8,115,30,8);else ctx.rect(8,8,115,30);
    ctx.fill();
    drawFlake(ctx,24,23,time*0.001);
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.font='bold 14px sans-serif';ctx.textAlign='left';
    ctx.fillText(`${s.score} / ${scoreToWin}`,38,28);

    // Предупреждение о броске
    if(s.netLunging&&s.netLunge>0.3){
      ctx.save();ctx.globalAlpha=s.netLunge*0.8;
      ctx.fillStyle=`rgba(251,191,36,${s.netLunge*0.1})`;ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=Math.min(1,s.netLunge*2);
      ctx.fillStyle='rgba(251,191,36,0.95)';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
      ctx.fillText('⚠ Аквариумист бросает сачок!',W/2,20);ctx.restore();
    }

    s.animId=requestAnimationFrame(gameLoop);
  },[scoreToWin,restartGame]);

  const startGame=useCallback(()=>{
    cancelAnimationFrame(idleAnimRef.current);
    restartGame(false);
    setPhase('playing');setSubscribed(false);setCopied(false);
    const s=stateRef.current;
    s.animId=requestAnimationFrame(gameLoop);
  },[restartGame,gameLoop]);

  useEffect(()=>()=>{cancelAnimationFrame(stateRef.current.animId);cancelAnimationFrame(idleAnimRef.current);},[]);

  const onMove=(cx:number,cy:number)=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const r=canvas.getBoundingClientRect();
    stateRef.current.targetX=(cx-r.left)*(W/r.width);
    stateRef.current.targetY=(cy-r.top)*(H/r.height);
  };

  return (
    <div className="relative w-full" style={{maxWidth:W}}>
      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl block"
        style={{aspectRatio:`${W}/${H}`,cursor:phase==='playing'?'crosshair':'default'}}
        onMouseMove={e=>onMove(e.clientX,e.clientY)}
        onTouchMove={e=>{e.preventDefault();onMove(e.touches[0].clientX,e.touches[0].clientY);}}
        onTouchStart={e=>{e.preventDefault();onMove(e.touches[0].clientX,e.touches[0].clientY);}}
      />

      {phase==='idle'&&(
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

      {phase==='won'&&(
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl text-white text-center p-6" style={{background:'linear-gradient(160deg,#0c4a6e 0%,#082f49 100%)'}}>
          {!subscribed?(<>
            <TrophySVG size={64}/>
            <h3 className="text-2xl font-bold mt-3 mb-1">Ты набрал {score} очков!</h3>
            <p className="text-white/70 text-sm mb-5">Подпишись на Telegram — и получи промокод</p>
            <a href={`https://t.me/${tgChannel.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              onClick={()=>setTimeout(()=>setSubscribed(true),1500)}
              className="flex items-center gap-2 px-6 py-3 bg-[#2AABEE] hover:bg-[#1a9ad4] text-white font-bold rounded-xl transition-colors mb-3 shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
              Подписаться на Telegram
            </a>
            <button onClick={()=>setSubscribed(true)} className="text-xs text-white/30 hover:text-white/60 transition-colors">Уже подписан</button>
          </>):(<>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400/40 mb-3">
              <FishSVG size={40}/>
            </div>
            <h3 className="text-xl font-bold mb-3">Твой промокод:</h3>
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-5 py-3 mb-2">
              <span className="text-3xl font-mono font-black tracking-widest text-cyan-300">{promoCode}</span>
              <button onClick={()=>{navigator.clipboard.writeText(promoCode);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 transition-colors">
                {copied?<span className="text-green-400 text-xs font-bold">✓</span>
                  :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
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