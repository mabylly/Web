// Whiteboard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, PencilBrush } from 'fabric';
import { FiEdit3, FiSquare, FiTrash2 } from 'react-icons/fi';

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvas = useRef<Canvas | null>(null);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  useEffect(() => {
    if (!canvasRef.current || fabricCanvas.current) return;

    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: 'white',
    });

    const brush = new PencilBrush(canvas);
    brush.width = 3;
    brush.color = 'black';
    canvas.freeDrawingBrush = brush;

    fabricCanvas.current = canvas;
  }, []);

  useEffect(() => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;

    if (tool === 'pencil') {
      const brush = new PencilBrush(canvas);
      brush.width = 3;
      brush.color = 'black';
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
    }

    if (tool === 'eraser') {
      const brush = new PencilBrush(canvas);
      brush.width = 20;
      brush.color = 'white';
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
    }
  }, [tool]);

  const handleClear = () => {
    if (fabricCanvas.current) {
      fabricCanvas.current.clear();

    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTool('pencil')}
          className={`p-3 rounded-xl ${tool === 'pencil' ? 'bg-blue-600 text-white' : 'bg-black text-white'}`}
          title="Lápis"
        >
          <FiEdit3 size={20} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-3 rounded-xl ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-black text-white'}`}
          title="Borracha"
        >
          <FiSquare size={20} />
        </button>
        <button
          onClick={handleClear}
          className="p-3 bg-black text-white rounded-xl"
          title="Limpar"
        >
          <FiTrash2 size={20} />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="border border-gray-400 rounded-xl shadow"
      />
    </div>
  );
}
