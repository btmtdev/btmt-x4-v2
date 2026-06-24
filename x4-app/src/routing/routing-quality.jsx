import { lazy } from "react"

const BlacklistPage = lazy(() => import("@/pages/quality/blacklist"))
const BlacklistApprovalPage = lazy(() => import("@/pages/quality/blacklist-approval"))

export const qualityRoutes = [
  { path: "/quality/blacklist", element: <BlacklistPage /> },
  { path: "/quality/blacklist-approval", element: <BlacklistApprovalPage /> },
]
