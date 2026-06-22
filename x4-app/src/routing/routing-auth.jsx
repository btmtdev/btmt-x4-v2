import { lazy } from "react"

const LoginPage = lazy(() => import("@/pages/auth/login"))
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"))

export const authRoutes = [
  { path: "/auth/login", element: <LoginPage /> },
  { path: "/auth/forgot-password", element: <ForgotPasswordPage /> },
]
