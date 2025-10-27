import './App.css';
import { useRef } from 'react';
import { World } from '../world/World';
function App() {
  const canvasRef = useRef();
  const world = new World(canvasRef.current);

  return (
    <>
      <h1>Homepage</h1>
      <canvas ref={canvasRef.current}></canvas>
    </>
  );
}

export default App;
