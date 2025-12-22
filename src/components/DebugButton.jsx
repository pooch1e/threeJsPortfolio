import { useSearchParams } from 'react-router-dom';
export default function DebugButton() {
  const [searchParams, setSearchParams] = useSearchParams();
  const debugMode = searchParams.get('debug') === 'true';

  const handleButtonClick = () => {
    if (debugMode) {
      setSearchParams('');
    } else {
      setSearchParams({ debug: 'true' });
    }
  };

  return (
    <button
      className="rounded-md transition-colors ease-linear hover:bg-cyan-300 p-2"
      onClick={handleButtonClick}>
      Debug Mode {debugMode ? '✓' : ''}
    </button>
  );
}
