import './App.css';

import HomePage from './pages/HomePage';
import AnimalRenderPage from './pages/AnimalRenderPage';
import PointCloudPage from './pages/PointCloudPage';
import { Routes, Route } from 'react-router-dom';
import NavBar from './ui/NavBar';

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/pointCloud" element={<PointCloudPage />}></Route>
        <Route path="/animalPage" element={<AnimalRenderPage />}></Route>
      </Routes>
    </>
  );
}

export default App;
