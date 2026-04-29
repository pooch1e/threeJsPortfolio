import { Navigate, Outlet } from "react-router-dom";
import { userLoginStore } from "../store/user";

function ProtectedRoute() {
  const isAuthenticated = userLoginStore((s) => s.isAuthenticated);
  const isLoading = userLoginStore((s) => s.isLoading);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
