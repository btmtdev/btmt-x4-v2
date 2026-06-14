import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import * as icons from "lucide-react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { adminService } from "@/services/admin"

ModuleRegistry.registerModules([AllCommunityModule])

export default function PendingUsers() {
  const { t, i18n } = useTranslation()
  const [pageLoading, setPageLoading] = useState(true)
  const [users, setUsers] = useState([])

  useEffect(() => { load() }, [])
  async function load() {
    const u = await adminService.getUsers()
    setUsers(u.filter(x => x.is_pending))
    setPageLoading(false)
  }

  async function approve(key) { await adminService.updateUserStatus(key, "active"); load() }
  async function reject(key) { await adminService.updateUserStatus(key, "rejected"); load() }

  const gridTheme = useMemo(() => themeQuartz.withParams({ fontFamily: ["BridgestoneType", "Google Sans", "sans-serif"], fontSize: "0.75rem", rowHeight: 32, headerHeight: 32 }), [])

  const ActionsRenderer = useCallback((p) => (
    <div className="flex gap-1 items-center h-full">
      <Button size="sm" mode="icon" variant="outline" title="Approve" onClick={() => approve(p.data.key)}><icons.CheckCircle className="size-4 text-green-600" /></Button>
      <Button size="sm" mode="icon" variant="outline" title="Reject" onClick={() => reject(p.data.key)}><icons.XCircle className="size-4 text-red-500" /></Button>
    </div>
  ), [])

  const columnDefs = useMemo(() => [
    { field: "key", headerName: t("USERNAME"), filter: true, sortable: true, flex: 1 },
    { headerName: t("USERS.NAME"), valueGetter: p => i18n.language === "th" ? (p.data.display_name_th || p.data.display_name_en || "-") : (p.data.display_name_en || p.data.display_name_th || "-"), filter: true, sortable: true, flex: 1.5 },
    { field: "dept_name", headerName: t("USERS.ORG"), filter: true, sortable: true, flex: 1, cellRenderer: p => p.value || "-" },
    { headerName: t("ACTIONS"), width: 120, sortable: false, filter: false, cellRenderer: ActionsRenderer },
  ], [t, i18n.language])

  const localeText = useMemo(() => i18n.language === "th" ? {
    page: t("AG_GRID.PAGE"), of: t("AG_GRID.OF"), to: t("AG_GRID.TO"),
    more: t("AG_GRID.MORE"), firstPage: t("AG_GRID.FIRST_PAGE"),
    previousPage: t("AG_GRID.PREVIOUS_PAGE"), nextPage: t("AG_GRID.NEXT_PAGE"),
    lastPage: t("AG_GRID.LAST_PAGE"), filterOoo: t("AG_GRID.FILTER"),
    applyFilter: t("AG_GRID.APPLY"), clearFilter: t("AG_GRID.CLEAR"),
    resetFilter: t("AG_GRID.RESET"), cancelFilter: t("AG_GRID.CANCEL"),
    equals: t("AG_GRID.EQUALS"), notEqual: t("AG_GRID.NOT_EQUAL"),
    lessThan: t("AG_GRID.LESS_THAN"), greaterThan: t("AG_GRID.GREATER_THAN"),
    contains: t("AG_GRID.CONTAINS"), notContains: t("AG_GRID.NOT_CONTAINS"),
    startsWith: t("AG_GRID.STARTS_WITH"), endsWith: t("AG_GRID.ENDS_WITH"),
    blank: t("AG_GRID.BLANK"), notBlank: t("AG_GRID.NOT_BLANK"),
    andCondition: t("AG_GRID.AND"), orCondition: t("AG_GRID.OR"),
    noRowsToShow: t("AG_GRID.NO_ROWS"), pageSizeSelectorLabel: t("AG_GRID.PAGE_SIZE"),
  } : undefined, [t, i18n.language])

  if (pageLoading) return <Spinner />

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">{t("USERS.PENDING_APPROVAL")}</h2>
      <div style={{ height: 500, width: "100%" }}>
        <AgGridReact
          theme={gridTheme}
          localeText={localeText}
          rowData={users}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true }}
          pagination={true}
          paginationPageSize={20}
          animateRows={true}
        />
      </div>
    </div>
  )
}
