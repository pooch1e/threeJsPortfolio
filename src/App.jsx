import './App.css';
import { useRef, useEffect } from 'react';
import { World } from '../world/World';
import { useSearchParams } from 'react-router-dom';

function App() {
  const canvasRef = useRef();
  const worldRef = useRef();
  const [searchParams] = useSearchParams();

  const debugMode = searchParams.get('debug') === 'true';

  useEffect(() => {
    if (canvasRef.current && !worldRef.current) {
      worldRef.current = new World(canvasRef.current, { debug: debugMode });
    }

    return () => {
      if (worldRef.current) {
        worldRef.current.destroy();

        worldRef.current = null;
      }
    };
  }, [debugMode]);

  return (
    <>
      <h1>Homepage</h1>
      <canvas ref={canvasRef}></canvas>
    </>
  );
}

export default App;
