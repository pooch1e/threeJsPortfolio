import "./App.css";
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { apiClient } from "./utils/api";
import { userLoginStore } from "./store/user";

import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import LoadingOverlay from "./components/LoadingOverlay";

import Login from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

const HomePage = lazy(() => import("./pages/HomePage"));
const AnimalRenderPage = lazy(() => import("./pages/AnimalRenderPage"));
const PointCloudPage = lazy(() => import("./pages/PointCloudPage"));
const ShaderPage = lazy(() => import("./pages/ShaderPage"));
const PortalPage = lazy(() => import("./pages/PortalPage"));
const AsciiPage = lazy(() => import("./pages/AsciiPage"));
const SineWavePage = lazy(() => import("./pages/SineWavePage"));
const FlowerPage = lazy(() => import("./pages/FlowerPage"));
function App() {
  const setUsername = userLoginStore((s) => s.setUsername);
  const setLoaded = userLoginStore((s) => s.setLoaded);
  const logout = userLoginStore((s) => s.logout);

  useEffect(() => {
    apiClient("/api/me")
      .then((res) => {
        // Backend returns user object { name, email, ... }
        // The repo uses 'name' for username
        if (res && (res.name || res.username)) {
          setUsername(res.name || res.username);
        } else {
          logout();
        }
      })
      .catch((err) => {
        console.log("Session verification failed:", err);
        logout();
      })
      .finally(() => setLoaded());
  }, []);

  return (
    <>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route
              path="/homepage"
              element={
                <Suspense fallback={<LoadingOverlay />}>
                  <HomePage />
                </Suspense>
              }
            />
            <Route
              path="/pointCloud"
              element={
                <Suspense fallback={<LoadingOverlay />}>
                  <PointCloudPage />
                </Suspense>
              }
            />
            <Route
              path="/animalPage"
              element={
                <Suspense fallback={<LoadingOverlay />}>
                  <AnimalRenderPage />
                </Suspense>
              }
            />
            <Route
              path="/shaders"
              element={
                <Suspense fallback={<LoadingOverlay />}>
                  <ShaderPage />
                </Suspense>
              }
            />
            <Route
              path="/sineWave"
              element={
                <Suspense fallback={<LoadingOverlay />}>
                  <SineWavePage />
                </Suspense>
              }
            />
            <Route
              path="/portalblend"
              element={
                <Suspense fallback={<LoadingOverlay />}>
                  <PortalPage />
                </Suspense>
              }
            />
            <Route
              path="/ascii"
              element={
                <Suspense fallback={<LoadingOverlay />}>
                  <AsciiPage />
                </Suspense>
              }
            />
            <Route
              path="/flower"
              element={
                <Suspense fallback={<LoadingOverlay />}>
                  <FlowerPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
        {/* No header/footer — redirect away if already logged in */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/" element={<Login />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
