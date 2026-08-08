function InlineNotice({ tone = "error", children }) {
  const styles = tone === "success"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : tone === "warning"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
      : "border-red-500/30 bg-red-500/10 text-red-300"

  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  )
}

export default InlineNotice
