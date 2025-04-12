import React, { useEffect, forwardRef, useImperativeHandle } from 'react';

interface Canvas2DProps {
  width?: number;
  height?: number;
}

export interface Canvas2DRef {
  getContext: () => CanvasRenderingContext2D | null;
}

const Canvas2D = forwardRef<Canvas2DRef, Canvas2DProps>(({ width = 400, height = 300 }, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    getContext: () => {
      return canvasRef.current?.getContext('2d', { alpha: true }) || null;
    }
  }));

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
});

Canvas2D.displayName = 'Canvas2D';

export default Canvas2D; 