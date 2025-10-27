import './App.css';
import { useRef } from 'react';

function App() {
  const canvasRef = useRef();
  return (
    <>
      <h1>Homepage</h1>
      <canvas ref={canvasRef.current}></canvas>
    </>
  );
}

export default App;
