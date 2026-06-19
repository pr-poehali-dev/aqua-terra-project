export const W = 600, H = 360, WIN = 25;

export interface Food { x:number;y:number;vx:number;vy:number;type:'flake'|'worm';id:number;angle:number;wobble:number; }
export interface Bubble { x:number;y:number;r:number;speed:number;op:number;wobble:number; }
export interface Weed { x:number;segments:number;totalH:number;color:string;phase:number;speed:number; }

let _id = 0;
export function mkFood(foods: Food[]) {
  const type: Food['type'] = Math.random() > 0.38 ? 'flake' : 'worm';
  const side = Math.floor(Math.random() * 4);
  let x = 0, y = 0, vx = 0, vy = 0;
  const spd = 1.6 + Math.random() * 2;
  if (side === 0) { x = 40 + Math.random() * (W - 80); y = -16; vx = (Math.random() - .5) * 1.2; vy = spd; }
  else if (side === 1) { x = W + 16; y = 20 + Math.random() * (H - 40); vx = -spd; vy = (Math.random() - .5) * 1.2; }
  else if (side === 2) { x = 40 + Math.random() * (W - 80); y = H + 16; vx = (Math.random() - .5) * 1.2; vy = -spd; }
  else { x = -16; y = 20 + Math.random() * (H - 40); vx = spd; vy = (Math.random() - .5) * 1.2; }
  foods.push({ x, y, vx, vy, type, id: _id++, angle: Math.random() * Math.PI * 2, wobble: Math.random() * Math.PI * 2 });
}

export function makeInitialBubbles(): Bubble[] {
  return Array.from({ length: 18 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: 1.5 + Math.random() * 3.5,
    speed: 0.15 + Math.random() * 0.3,
    op: 0.05 + Math.random() * 0.08,
    wobble: Math.random() * Math.PI * 2,
  }));
}

export function makeInitialWeeds(): Weed[] {
  return Array.from({ length: 10 }, (_, i) => ({
    x: 20 + i * (W - 40) / 9,
    segments: 2 + Math.floor(Math.random() * 4),
    totalH: H * (0.10 + Math.random() * 0.50),
    color: `rgba(${20 + Math.floor(Math.random() * 30)},${90 + Math.floor(Math.random() * 80)},${25 + Math.floor(Math.random() * 35)},0.8)`,
    phase: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.5,
  }));
}
