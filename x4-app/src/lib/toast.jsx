import { toast as sonnerToast } from "sonner"
import i18n from "@/i18n"

const icons = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const colors = {
  success: { bg: "bg-green-100", text: "text-green-600", bar: "bg-green-500", border: "border-b-green-500" },
  warning: { bg: "bg-amber-100", text: "text-amber-600", bar: "bg-amber-500", border: "border-b-amber-500" },
  error: { bg: "bg-red-100", text: "text-red-600", bar: "bg-red-500", border: "border-b-red-500" },
  info: { bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500", border: "border-b-blue-500" },
}

const labels = {
  success: () => i18n.t("TOAST.SUCCESS"),
  warning: () => i18n.t("TOAST.WARNING"),
  error: () => i18n.t("TOAST.ERROR"),
  info: () => i18n.t("TOAST.INFO"),
}

function CustomToast({ type, message }) {
  const c = colors[type]
  return (
    <div className={`w-[340px] bg-white rounded-lg shadow-lg border border-gray-100 border-b-2 ${c.border} overflow-hidden font-sans`}>
      <div className="flex items-start gap-3 p-3">
        <div className={`w-8 h-8 rounded-full ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
          {icons[type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${c.text}`}>{labels[type]()}</p>
          <p className="text-sm text-gray-600 mt-0.5">{message}</p>
        </div>
      </div>
      <div className={`h-1 ${c.bar} animate-[shrink_4s_linear_forwards]`} />
    </div>
  )
}

export const toast = {
  success: (msg) => sonnerToast.custom(() => <CustomToast type="success" message={msg} />, { duration: 4000 }),
  warning: (msg) => sonnerToast.custom(() => <CustomToast type="warning" message={msg} />, { duration: 4000 }),
  error: (msg) => sonnerToast.custom(() => <CustomToast type="error" message={msg} />, { duration: 4000 }),
  info: (msg) => sonnerToast.custom(() => <CustomToast type="info" message={msg} />, { duration: 4000 }),
}
