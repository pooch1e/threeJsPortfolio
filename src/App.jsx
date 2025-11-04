import './App.css';

import HomePage from './pages/HomePage';
import AnimalRenderPage from './pages/AnimalRenderPage';
import PointCloudPage from './pages/PointCloudPage';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/pointCloud" element={<PointCloudPage />}></Route>

        {/* // will be button to go to page / render page */}
        <Route path="/animalPage" element={<AnimalRenderPage />}></Route>
      </Routes>
    </>
  );
}

export default App;
