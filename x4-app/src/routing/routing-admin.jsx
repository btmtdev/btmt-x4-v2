import { lazy } from "react"

const RoleManagementPage = lazy(() => import("@/pages/admin/authorize/role"))
const UserManagementPage = lazy(() => import("@/pages/admin/authorize/user/user"))
const PendingUsersPage = lazy(() => import("@/pages/admin/users/pending"))
const TesterPage = lazy(() => import("@/pages/admin/sys-config/tester"))

export const adminRoutes = [
  { path: "/admin/authorize/role", element: <RoleManagementPage /> },
  { path: "/admin/authorize/user", element: <UserManagementPage /> },
  { path: "/admin/users/pending", element: <PendingUsersPage /> },
  { path: "/admin/sys-config/tester", element: <TesterPage /> },
]
