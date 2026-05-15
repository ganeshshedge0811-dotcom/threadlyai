import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  hue: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
}

const CursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const animFrameRef = useRef<number>(0);
  const hueRef = useRef(240); // Start with indigo hue

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Cycle hue slowly through indigo → purple → blue
      hueRef.current = (hueRef.current + 0.8) % 360;

      // Spawn multiple particles per move for a denser trail
      for (let i = 0; i < 4; i++) {
        const size = Math.random() * 8 + 3;
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          size,
          alpha: 1,
          hue: hueRef.current + Math.random() * 40 - 20,
          speedX: (Math.random() - 0.5) * 1.2,
          speedY: (Math.random() - 0.5) * 1.2 - 0.4,
          life: 0,
          maxLife: Math.random() * 30 + 20,
        });
      }

      // Cap particles to avoid memory leak
      if (particlesRef.current.length > 300) {
        particlesRef.current.splice(0, particlesRef.current.length - 300);
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      for (const p of particlesRef.current) {
        p.life++;
        const progress = p.life / p.maxLife;
        p.alpha = 1 - progress;
        p.x += p.speedX;
        p.y += p.speedY;
        p.size *= 0.97;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.alpha})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 90%, 55%, ${p.alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'screen',
      }}
    />
  );
};

export default CursorTrail;
