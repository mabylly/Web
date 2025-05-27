import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Canvas, PencilBrush} from 'fabric';
import { FiEdit3, FiSquare, FiTrash2 } from 'react-icons/fi';

// Tipagem para permitir o uso do ref no componente
export type WhiteboardHandle = {
  exportAsImage: () => string | null;
};

const Whiteboard = forwardRef<WhiteboardHandle>((_, ref) => {
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

  const exportAsImage = () => {
    if (fabricCanvas.current) {
      return fabricCanvas.current.toDataURL({
        format: 'png' as any,
        multiplier: 2,
      });
    }
    return null;
  };

  useImperativeHandle(ref, () => ({
    exportAsImage,
  }));

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative bg-white border-[12px] border-gray-300 rounded-3xl p-4 shadow-inner w-fit">
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white px-4 py-2 rounded-full shadow-lg z-10">
          <button
            onClick={() => setTool('pencil')}
            className={`p-3 rounded-xl ${tool === 'pencil' ? 'bg-blue-600 text-white' : 'bg-blue-400 text-white'}`}
            title="Lápis"
          >
            <FiEdit3 size={20} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-3 rounded-xl ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-blue-400 text-white'}`}
            title="Borracha"
          >
            <FiSquare size={20} />
          </button>
          <button
            onClick={handleClear}
            className="p-3 bg-blue-400 text-white rounded-xl"
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
    </div>
  );
});

export default Whiteboard;
