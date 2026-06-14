import { useTranslation } from "react-i18next"
import { ConfirmDialog } from "@/components/confirm-dialog"

export function ModalDeleteConfirm({ userId, onClose, onConfirm }) {
  const { t } = useTranslation()
  return (
    <ConfirmDialog
      open={!!userId}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("DELETE")}
      message={t("USERS.CONFIRM_DELETE")}
      confirmLabel={t("DELETE")}
      cancelLabel={t("CANCEL")}
    />
  )
}
