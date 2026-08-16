import "./App.css";
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { apiClient } from "./utils/api";
import { userLoginStore } from "./store/user";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import AdminRoute from "./components/AdminRoute";
import LoadingOverlay from "./components/LoadingOverlay";

import Login from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

const HomePage = lazy(() => import("./pages/HomePage"));
const ExperienceView = lazy(() => import("./pages/ExperienceView"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUserDetailPage = lazy(() => import("./pages/admin/AdminUserDetailPage"));

function App() {
  const setUsername = userLoginStore((s) => s.setUsername);
  const setUserId = userLoginStore((s) => s.setUserId);
  const setIsAdmin = userLoginStore((s) => s.setIsAdmin);
  const setLoaded = userLoginStore((s) => s.setLoaded);
  const logout = userLoginStore((s) => s.logout);

  useEffect(() => {
    apiClient("/api/me")
      .then((res) => {
        if (res && (res.name || res.username)) {
          setUsername(res.name || res.username);
          setUserId(res.id);
          setIsAdmin(res.is_admin);
        } else {
          logout();
        }
      })
      .catch((err) => {
        console.log("Session verification failed:", err);
        logout();
      })
      .finally(() => setLoaded());
  }, [logout, setUsername, setUserId, setIsAdmin, setLoaded]);

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
        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={
              <Suspense fallback={<LoadingOverlay />}>
                <AdminDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <Suspense fallback={<LoadingOverlay />}>
                <AdminUserDetailPage />
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
