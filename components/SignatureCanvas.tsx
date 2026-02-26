
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SignatureCanvasProps {
  onSave: (base64: string) => void;
  onClear?: () => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number, y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    // Scale coordinates to match canvas internal resolution
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    return { x, y };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    }
  }, [getCoordinates]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
    }
  }, [isDrawing, getCoordinates]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  }, [isDrawing, onSave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#BF953F';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      // Prevent scrolling when touching the canvas
      const preventDefault = (e: TouchEvent) => {
        if (e.target === canvas && e.cancelable) {
          e.preventDefault();
        }
      };
      document.addEventListener('touchstart', preventDefault, { passive: false });
      document.addEventListener('touchmove', preventDefault, { passive: false });
      document.addEventListener('touchend', preventDefault, { passive: false });

      return () => {
        document.removeEventListener('touchstart', preventDefault);
        document.removeEventListener('touchmove', preventDefault);
        document.removeEventListener('touchend', preventDefault);
      };
    }
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onSave('');
        if (onClear) onClear();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative glass border border-white/10 rounded-2xl overflow-hidden bg-black/40">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-[180px] cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button 
          type="button"
          onClick={clear}
          className="absolute top-3 right-3 text-[9px] uppercase tracking-widest text-[#BF953F] hover:text-white px-4 py-2 bg-black/60 rounded-full border border-[#BF953F]/20 transition-all active:scale-95"
        >
          Limpar Assinatura
        </button>
      </div>
      <p className="text-[9px] text-center uppercase tracking-[0.4em] text-stone-500 font-bold">Assinatura Digital da Cliente</p>
    </div>
  );
};

export default SignatureCanvas;
