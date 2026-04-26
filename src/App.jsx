import "./App.css";
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { apiClient } from "./utils/api";
import { userLoginStore } from "./store/user";

import MainLayout from "./layout/MainLayout";

// Eagerly load auth pages (tiny, always needed)
import Login from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

// Lazily load all Three.js heavy pages — only downloaded when navigated to
const HomePage = lazy(() => import("./pages/HomePage"));
const AnimalRenderPage = lazy(() => import("./pages/AnimalRenderPage"));
const PointCloudPage = lazy(() => import("./pages/PointCloudPage"));
const ShaderPage = lazy(() => import("./pages/ShaderPage"));
const PortalPage = lazy(() => import("./pages/PortalPage"));
const AsciiPage = lazy(() => import("./pages/AsciiPage"));
const SineWavePage = lazy(() => import("./pages/SineWavePage"));

function App() {
  const username = userLoginStore((s) => s.username);
  const setUsername = userLoginStore((s) => s.setUsername);

  useEffect(() => {
    if (!username) {
      apiClient("/api/me")
        .then((res) => {
          if (res && res.username) setUsername(res.username);
        })
        .catch((err) => console.log("Session fetch failed:", err));
    }
  }, [username, setUsername]);

  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/homepage"
            element={
              <Suspense fallback={null}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="/pointCloud"
            element={
              <Suspense fallback={null}>
                <PointCloudPage />
              </Suspense>
            }
          />
          <Route
            path="/animalPage"
            element={
              <Suspense fallback={null}>
                <AnimalRenderPage />
              </Suspense>
            }
          />
          <Route
            path="/shaders"
            element={
              <Suspense fallback={null}>
                <ShaderPage />
              </Suspense>
            }
          />
          <Route
            path="/sineWave"
            element={
              <Suspense fallback={null}>
                <SineWavePage />
              </Suspense>
            }
          />
          <Route
            path="/portalblend"
            element={
              <Suspense fallback={null}>
                <PortalPage />
              </Suspense>
            }
          />
          <Route
            path="/ascii"
            element={
              <Suspense fallback={null}>
                <AsciiPage />
              </Suspense>
            }
          />
        </Route>
        {/* No header/footer */}
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
