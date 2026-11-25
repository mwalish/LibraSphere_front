export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");
export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—");
export const fmtDateTime = (iso) => (iso ? `${fmtDate(iso)}, ${fmtTime(iso)}` : "—");
export const money = (v) => Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "Due today", "Due in 3 days", "2 days overdue" */
export function dueLabel(iso) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86_400_000);
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}
export const isStaffUser = (u) => !!u && (u.is_superuser || (u.roles?.length ?? 0) > 0);
export const isManagerUser = (u) => !!u && (u.is_superuser || u.roles?.some((r) => r.role === "branch_manager"));
