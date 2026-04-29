import { Navigate, Outlet } from "react-router-dom";
import { userLoginStore } from "../store/user";

function PublicOnlyRoute() {
  const isAuthenticated = userLoginStore((s) => s.isAuthenticated);
  const isLoading = userLoginStore((s) => s.isLoading);

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/homepage" replace />;

  return <Outlet />;
}

export default PublicOnlyRoute;
