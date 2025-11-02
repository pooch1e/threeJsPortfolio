import './App.css';
import { World } from '../world/World';
import { useSearchParams } from 'react-router-dom';
import { useWorld } from './hooks/useWorld';

function App() {
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const { canvasRef } = useWorld(World, { debug: debugMode }, [debugMode]);
  return (
    <>
      <h1>Homepage</h1>
      <canvas ref={canvasRef}></canvas>
    </>
  );
}

export default App;
