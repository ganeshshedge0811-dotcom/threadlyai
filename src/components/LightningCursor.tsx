import React, { useEffect, useRef } from 'react';

const LightningCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: width / 2, y: height / 2 };
    const history: { x: number; y: number }[] = [];
    const maxHistory = 15;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      history.push({ x: mouse.x, y: mouse.y });
      if (history.length > maxHistory) {
        history.shift();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (history.length > 1) {
        ctx.beginPath();
        ctx.moveTo(history[0].x, history[0].y);
        
        for (let i = 1; i < history.length; i++) {
          const pt = history[i];
          // Add some random jitter for the lightning effect
          const jitterX = (Math.random() - 0.5) * 10;
          const jitterY = (Math.random() - 0.5) * 10;
          
          // Smooth the path somewhat but keep the jitter
          const cx = (history[i - 1].x + pt.x) / 2 + jitterX;
          const cy = (history[i - 1].y + pt.y) / 2 + jitterY;
          
          ctx.quadraticCurveTo(history[i - 1].x, history[i - 1].y, cx, cy);
        }
        
        ctx.lineTo(history[history.length - 1].x, history[history.length - 1].y);
        
        // Style the lightning
        ctx.strokeStyle = 'rgba(120, 150, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(100, 140, 255, 1)';
        ctx.stroke();

        // Inner white core
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 5;
        ctx.stroke();
      }

      // Gradually remove history if mouse is still
      if (history.length > 0) {
        history.shift();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default LightningCursor;
