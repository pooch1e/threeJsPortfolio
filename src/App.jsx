import "./App.css";
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { apiClient } from "./utils/api";
import { userLoginStore } from "./store/user";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import LoadingOverlay from "./components/LoadingOverlay";

import Login from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

const HomePage = lazy(() => import("./pages/HomePage"));
const ExperienceView = lazy(() => import("./pages/ExperienceView"));

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
  }, [logout, setUsername, setLoaded]);

  return (
    <>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route
            path="/homepage"
            element={
              <Suspense fallback={<LoadingOverlay />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="/experience/:slug"
            element={
              <Suspense fallback={<LoadingOverlay />}>
                <ExperienceView />
              </Suspense>
            }
          />
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
