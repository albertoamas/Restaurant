import { useRef, useEffect } from 'react';

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b','#fbbf24','#ef4444','#8b5cf6','#10b981','#3b82f6','#ec4899','#f97316'];

    const particles = Array.from({ length: 130 }, () => ({
      x:     Math.random() * canvas.width,
      y:     -20 - Math.random() * 200,
      w:     5  + Math.random() * 10,
      h:     3  + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy:    2  + Math.random() * 5,
      vx:    (Math.random() - 0.5) * 3,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.15,
    }));

    const start = Date.now();
    let animId: number;

    function frame() {
      const elapsed = Date.now() - start;
      if (elapsed > 5500) { ctx!.clearRect(0, 0, canvas!.width, canvas!.height); return; }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const fade = elapsed > 4500 ? 1 - (elapsed - 4500) / 1000 : 1;

      for (const p of particles) {
        p.y += p.vy; p.x += p.vx; p.angle += p.spin;
        if (p.y > canvas!.height + 20) { p.y = -20; p.x = Math.random() * canvas!.width; }
        ctx!.save();
        ctx!.globalAlpha = fade;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.angle);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999, width: '100vw', height: '100vh' }}
    />
  );
}
