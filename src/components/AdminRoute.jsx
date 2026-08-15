/**
 * AdminRoute — route guard that only renders its nested routes for
 * authenticated admin users, redirecting everyone else.
 */
import { Navigate, Outlet } from "react-router-dom";
import { userLoginStore } from "../store/user";
import LoadingOverlay from "./LoadingOverlay";

function AdminRoute() {
  const isAuthenticated = userLoginStore((s) => s.isAuthenticated);
  const isAdmin = userLoginStore((s) => s.isAdmin);
  const isLoading = userLoginStore((s) => s.isLoading);

  if (isLoading) return <LoadingOverlay />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/homepage" replace />;

  return <Outlet />;
}

export default AdminRoute;
