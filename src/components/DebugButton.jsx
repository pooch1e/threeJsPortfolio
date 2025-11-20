import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
export default function DebugButton() {
  const [isClicked, setIsClicked] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleButtonClick = (e) => {
    setIsClicked(e);
    if (isClicked) {
      setSearchParams('?debug=true');
    } else {
      setSearchParams('');
    }
  };

  return (
    <button
      className="rounded-md transition-colors ease-linear hover:bg-cyan-300 p-2"
      onClick={() => handleButtonClick(!isClicked)}>
      Debug Mode
    </button>
  );
}
