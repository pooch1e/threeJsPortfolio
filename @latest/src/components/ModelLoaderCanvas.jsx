import { useRef } from 'react';
export const ModelLoaderCanvas = () => {
  const canvasRef = useRef(null);
  return (
    <div>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};
