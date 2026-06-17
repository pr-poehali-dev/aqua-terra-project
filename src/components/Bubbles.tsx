const BUBBLES = [
  { left: '8%',  size: 10, dur: 7,  delay: 0 },
  { left: '15%', size: 6,  dur: 9,  delay: 1.5 },
  { left: '23%', size: 14, dur: 11, delay: 0.8 },
  { left: '34%', size: 8,  dur: 8,  delay: 3 },
  { left: '45%', size: 5,  dur: 10, delay: 0.3 },
  { left: '55%', size: 12, dur: 13, delay: 2 },
  { left: '63%', size: 7,  dur: 7,  delay: 4 },
  { left: '72%', size: 9,  dur: 12, delay: 1 },
  { left: '80%', size: 5,  dur: 9,  delay: 2.5 },
  { left: '88%', size: 11, dur: 10, delay: 0.5 },
  { left: '93%', size: 6,  dur: 8,  delay: 3.5 },
  { left: '29%', size: 4,  dur: 14, delay: 5 },
  { left: '50%', size: 7,  dur: 11, delay: 6 },
  { left: '68%', size: 5,  dur: 9,  delay: 1.2 },
];

export default function Bubbles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-[1px]"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animation: `bubble ${b.dur}s ${b.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}
