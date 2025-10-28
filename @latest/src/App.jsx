import './App.css';
import { useRef, useEffect } from 'react';
import { World } from '../world/World';

function App() {
  const canvasRef = useRef();
  const worldRef = useRef();
  
  useEffect(() => {
    if (canvasRef.current && !worldRef.current) {
      worldRef.current = new World(canvasRef.current);
    }
    
    return () => {
      if (worldRef.current) {
        worldRef.current.destroy();
        worldRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <h1>Homepage</h1>
      <canvas ref={canvasRef}></canvas>
    </>
  );
}

export default App;
