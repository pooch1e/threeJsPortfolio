import { useRef, useEffect } from 'react';
import { World } from '../../world/World';
export const ModelLoaderCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvasCurrent = canvasRef.current;
    const modelLoaderWorld = new World(canvasCurrent);
    console.log(modelLoaderWorld);
  });

  return (
    <div>
      <canvas width={900} height={900} ref={canvasRef}></canvas>
    </div>
  );
};
