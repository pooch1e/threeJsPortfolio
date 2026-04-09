import './App.css';


import HomePage from './pages/HomePage';
import AnimalRenderPage from './pages/AnimalRenderPage';
import PointCloudPage from './pages/PointCloudPage';
import ShaderPage from './pages/ShaderPage';
import PortalPage from './pages/PortalPage'
import { Routes, Route } from 'react-router-dom';

import SineWavePage from './pages/SineWavePage';
import SignUpPage from './pages/SignUpPage';
import MainLayout from './layout/MainLayout';



function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}/>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/pointCloud" element={<PointCloudPage />}></Route>
        <Route path="/animalPage" element={<AnimalRenderPage />}></Route>
        <Route path="/shaders" element={<ShaderPage />}></Route>
        <Route path="/sineWave" element={<SineWavePage />}></Route>
        <Route path="/portalblend" element={<PortalPage />}></Route>

        {/* No header/ footer */}
        <Route path='/signup' element={<SignUpPage/>}></Route>
      </Routes>
    </>
  );
}

export default App;
