import "./App.css";

import HomePage from "./pages/HomePage";
import AnimalRenderPage from "./pages/AnimalRenderPage";
import PointCloudPage from "./pages/PointCloudPage";
import ShaderPage from "./pages/ShaderPage";
import PortalPage from "./pages/PortalPage";
import AsciiPage from "./pages/AsciiPage";
import { Routes, Route } from "react-router-dom";

import SineWavePage from "./pages/SineWavePage";
import SignUpPage from "./pages/SignUpPage";
import MainLayout from "./layout/MainLayout";
import Login from "./pages/LoginPage";
import { useEffect } from "react";
import { apiClient } from "./utils/api";
import { userLoginStore } from "./store/user";

function App() {
  const setUsername = userLoginStore((s) => s.setUsername);
  const fetchUsername = async () => {
    try {
      const res = await apiClient("/api/me");
      console.log(res);
    } catch (err) {
      console.log(err);
    }
  };

  fetchUsername();

  // useEffect(() => {
  //   const validSession = apiClient("/api/me");
  //   if (validSession) {
  //     user.set(validSession);
  //   }
  // }, [user]);
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/homepage" element={<HomePage />}></Route>
          <Route path="/pointCloud" element={<PointCloudPage />}></Route>
          <Route path="/animalPage" element={<AnimalRenderPage />}></Route>
          <Route path="/shaders" element={<ShaderPage />}></Route>
          <Route path="/sineWave" element={<SineWavePage />}></Route>
          <Route path="/portalblend" element={<PortalPage />}></Route>
          <Route path="/ascii" element={<AsciiPage />}></Route>
        </Route>
        {/* No header/ footer */}
        <Route path="/signup" element={<SignUpPage />}></Route>
        <Route path="/" element={<Login />}></Route>
      </Routes>
    </>
  );
}

export default App;
