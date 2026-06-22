import { lazy } from "react"

const SystemStatusPage = lazy(() => import("@/pages/public/system-status"))

export const publicRoutes = [
  { path: "/status", element: <SystemStatusPage /> },
]
