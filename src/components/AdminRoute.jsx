import { Navigate, Outlet } from "react-router-dom";
import { userLoginStore } from "../store/user";

function AdminRoute() {
  const isAuthenticated = userLoginStore((s) => s.isAuthenticated);
  const isAdmin = userLoginStore((s) => s.isAdmin);
  const isLoading = userLoginStore((s) => s.isLoading);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/homepage" replace />;

  return <Outlet />;
}

export default AdminRoute;
