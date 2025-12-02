import './App.css';

import HomePage from './pages/HomePage';
import AnimalRenderPage from './pages/AnimalRenderPage';
import PointCloudPage from './pages/PointCloudPage';
import ShaderPage from './pages/ShaderPage';
import { Routes, Route } from 'react-router-dom';
import Header from './ui/Header';
import Footer from './ui/Footer';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/pointCloud" element={<PointCloudPage />}></Route>
        <Route path="/animalPage" element={<AnimalRenderPage />}></Route>
        <Route path="/shaders" element={<ShaderPage />}></Route>
      </Routes>
      <Footer />
    </>
  );
}

export default App;
