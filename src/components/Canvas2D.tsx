import React, { useEffect, useRef } from 'react';

interface Canvas2DProps {
  width?: number;
  height?: number;
}

const Canvas2D: React.FC<Canvas2DProps> = ({ width = 400, height = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Canvas2Dの初期化
    ctx.clearRect(0, 0, width, height);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: 'none' }}
    />
  );
};

export default Canvas2D; 