import './App.css';

import HomePage from './pages/HomePage';
import AnimalRenderPage from './pages/AnimalRenderPage';

function App() {
  return (
    <>
      <HomePage>
        {/* // will be button to go to page / render page */}
        <AnimalRenderPage />
      </HomePage>
    </>
  );
}

export default App;
