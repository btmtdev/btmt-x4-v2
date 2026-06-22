import { Navigate, Outlet } from "react-router-dom"

export default function RequireAuth() {
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  if (!token || !user.key) return <Navigate to="/auth/login" replace />
  return <Outlet />
}
