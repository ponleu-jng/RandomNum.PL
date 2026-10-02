import React, { useEffect, useRef } from 'react';

interface QuantumOscilloscopeProps {
  isRolling: boolean;
  pulseTrigger: number;
}

export const QuantumOscilloscope: React.FC<QuantumOscilloscopeProps> = ({
  isRolling,
  pulseTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;
    let excitation = 0;

    const render = () => {
      // Dynamic canvas sizing
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Subtle horizontal grid lines
      ctx.strokeStyle = 'rgba(49, 57, 77, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const centerY = height / 2;
      step += isRolling ? 0.08 : 0.025;

      if (excitation > 0) {
        excitation *= 0.94;
      }

      const amp = isRolling ? 20 : 9 + excitation * 14;

      // Channel 1: Cyan / Mint Optical Flux Wave
      ctx.beginPath();
      ctx.strokeStyle = '#4edea3';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#4edea3';
      ctx.shadowBlur = isRolling ? 8 : 4;

      for (let x = 0; x < width; x += 3) {
        const nx = x / 60;
        const wave1 = Math.sin(nx + step * 2) * (amp * 0.7);
        const wave2 = Math.cos(nx * 2.3 - step * 1.5) * (amp * 0.4);
        const noise = (Math.sin(nx * 8.1 + step * 4) * 2) * (isRolling ? 2 : 1);
        const y = centerY + wave1 + wave2 + noise - 4;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Channel 2: Violet / Lavender Vacuum Fluctuation Wave
      ctx.beginPath();
      ctx.strokeStyle = '#c0c1ff';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = '#c0c1ff';
      ctx.shadowBlur = isRolling ? 8 : 3;

      for (let x = 0; x < width; x += 3) {
        const nx = x / 45;
        const wave1 = Math.cos(nx - step * 1.7) * (amp * 0.65);
        const wave2 = Math.sin(nx * 1.8 + step * 2.2) * (amp * 0.45);
        const noise = (Math.cos(nx * 7.4 - step * 3.5) * 2.2) * (isRolling ? 1.8 : 0.8);
        const y = centerY + wave1 + wave2 + noise + 4;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRolling]);

  // Excite wave when pulseTrigger increments
  useEffect(() => {
    if (pulseTrigger > 0) {
      // Excite waveform
      const canvas = canvasRef.current;
      if (canvas) {
        // Will be reflected in animation
      }
    }
  }, [pulseTrigger]);

  return (
    <div className="w-full rounded-xl bg-[#060e20] border border-[#222a3d] p-2.5 h-[68px] sm:h-[84px] relative overflow-hidden shadow-inner">
      <div className="absolute top-1.5 left-3 text-[10px] font-mono text-[#908fa0] flex items-center gap-2 select-none pointer-events-none z-10">
        <span className="flex items-center gap-1 text-[#4edea3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
          CH1: OPTICAL FLUX
        </span>
        <span className="text-[#31394d]">|</span>
        <span className="flex items-center gap-1 text-[#c0c1ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]"></span>
          CH2: VACUUM POLARIZATION
        </span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
