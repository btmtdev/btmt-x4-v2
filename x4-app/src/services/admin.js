const BASE_URL = import.meta.env.VITE_API_URL ?? ""

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    })
  } catch {
    const err = new Error("NETWORK_ERROR")
    err.code = "NETWORK_ERROR"
    throw err
  }
  const data = await res.json().catch(() => ({}))
  if (!data.status) {
    const code = data.error?.error_code ?? "UNKNOWN_ERROR"
    const err = new Error(code)
    err.code = code
    throw err
  }
  return data.data
}

export const adminService = {
  getUsers: () => request("/api/users"),
  createUser: (dto) => request("/api/users", { method: "POST", body: JSON.stringify(dto) }),
  lookupGatewayProfile: (identifier) => request(`/api/users/gateway-profile/${identifier}`),
  updateUserStatus: (id, status) => request(`/api/users/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
  hardDeleteUser: (id) => request(`/api/users/${id}/hard`, { method: "DELETE" }),
  updateUserProfile: (id, dto) => request(`/api/users/${id}/profile`, { method: "PUT", body: JSON.stringify(dto) }),

  getPermissions: () => request("/api/permissions"),
  getPermissionsFlat: (maxLevel) => request(`/api/permissions/flat${maxLevel ? `?max_level=${maxLevel}` : ""}`),
  createPermission: (dto) => request("/api/permissions", { method: "POST", body: JSON.stringify(dto) }),
  updatePermission: (id, dto) => request(`/api/permissions/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  deletePermission: (id) => request(`/api/permissions/${id}`, { method: "DELETE" }),
  reorderPermissions: (items) => request("/api/permissions/reorder", { method: "POST", body: JSON.stringify(items) }),

  getRoles: () => request("/api/roles"),
  createRole: (dto) => request("/api/roles", { method: "POST", body: JSON.stringify(dto) }),
  updateRole: (id, dto) => request(`/api/roles/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  deleteRole: (id) => request(`/api/roles/${id}`, { method: "DELETE" }),
  getRoleUsers: (id) => request(`/api/roles/${id}/users`),
  addUserToRole: (id, userId) => request(`/api/roles/${id}/users/${userId}`, { method: "POST" }),
  removeUserFromRole: (id, userId) => request(`/api/roles/${id}/users/${userId}`, { method: "DELETE" }),

  getUserRoles: (userId) => request(`/api/users/${userId}/roles`),
  setUserRoles: (userId, roleIds) => request(`/api/users/${userId}/roles`, { method: "POST", body: JSON.stringify({ role_keys: roleIds }) }),
  setUserOverrides: (userId, overrides) => request(`/api/users/${userId}/overrides`, { method: "POST", body: JSON.stringify({ overrides: overrides.map(o => ({ perm_key: o.permissionId, type: o.overrideType })) }) }),
  getEffectivePermissions: (userId) => request(`/api/users/${userId}/permissions`),
  getUserSettings: (userId) => request(`/api/settings/user/${userId}`),
  setUserSettings: (userId, settings) => request(`/api/settings/user/${userId}`, { method: "PUT", body: JSON.stringify(settings) }),
}
