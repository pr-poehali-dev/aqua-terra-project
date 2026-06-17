const BUBBLES = [
  { left: '5%',  size: 8,  dur: 8,  delay: 0 },
  { left: '12%', size: 5,  dur: 10, delay: 1.5 },
  { left: '20%', size: 13, dur: 12, delay: 0.8 },
  { left: '30%', size: 7,  dur: 9,  delay: 3 },
  { left: '40%', size: 4,  dur: 11, delay: 0.3 },
  { left: '50%', size: 11, dur: 14, delay: 2 },
  { left: '58%', size: 6,  dur: 7,  delay: 4 },
  { left: '67%', size: 9,  dur: 13, delay: 1 },
  { left: '75%', size: 4,  dur: 10, delay: 2.5 },
  { left: '83%', size: 10, dur: 11, delay: 0.5 },
  { left: '90%', size: 5,  dur: 9,  delay: 3.5 },
  { left: '95%', size: 7,  dur: 8,  delay: 1.8 },
  { left: '25%', size: 3,  dur: 15, delay: 5 },
  { left: '47%', size: 6,  dur: 12, delay: 6.5 },
  { left: '70%', size: 4,  dur: 10, delay: 1.2 },
  { left: '35%', size: 9,  dur: 13, delay: 7 },
];

export default function Bubbles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <style>{`
        @keyframes rise {
          0%   { transform: translateY(0) scale(1);    opacity: 0.7; }
          20%  { opacity: 0.5; }
          80%  { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.6); opacity: 0; }
        }
        @keyframes sway {
          0%, 100% { margin-left: 0px; }
          50%       { margin-left: 14px; }
        }
        .bubble-wrap { animation: sway ease-in-out infinite; }
        .bubble-inner { animation: rise linear infinite; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.35); }
      `}</style>

      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="bubble-wrap absolute bottom-0"
          style={{
            left: b.left,
            animationDuration: `${b.dur * 1.3}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <div
            className="bubble-inner"
            style={{
              width: b.size,
              height: b.size,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
