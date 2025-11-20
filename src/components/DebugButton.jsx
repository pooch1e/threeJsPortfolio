import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
export default function DebugButton() {
  const [isClicked, setIsClicked] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  // if button clicked add debug to search params

  const handleButtonClick = (e) => {
    setIsClicked(e);
    setSearchParams('?debug=true');
  };

  return (
    <button onClick={() => handleButtonClick(!isClicked)}>Debug Mode</button>
  );
}
