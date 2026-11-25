import { useEffect, useState } from "react";

export const cx = (...a) => a.filter(Boolean).join(" ");

/** Bootstrap Icons: <Icon name="search" />  (names at icons.getbootstrap.com) */
export const Icon = ({ name, className }) => <i className={cx(`bi bi-${name}`, className)} aria-hidden="true" />;

export function Button({ variant = "primary", className, ...p }) {
  const styles = {
    primary: "bg-primary text-onprimary hover:opacity-90 px-4 py-2",
    accent: "bg-saffron text-[#1E1233] hover:opacity-90 px-4 py-2",
    ghost: "border border-line bg-surface text-ink hover:bg-line/40 px-4 py-2",
    danger: "bg-brick text-white hover:opacity-90 px-4 py-2",
    link: "text-teal underline-offset-2 hover:underline",
    dangerLink: "text-brick underline-offset-2 hover:underline",
  }[variant];
  return (
    <button className={cx("inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", styles, className)} {...p} />
  );
}

export const Card = ({ className, ...p }) => <section className={cx("rounded-xl border border-line bg-surface/90 backdrop-blur-sm", className)} {...p} />;

const TONES = {
  good: "bg-teal/15 text-teal", warn: "bg-saffron/25 text-ink", bad: "bg-brick/15 text-brick", quiet: "bg-line/60 text-muted",
};
export const Badge = ({ tone = "quiet", children }) => (
  <span className={cx("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone])}>{children}</span>
);

export const Skeleton = ({ className }) => <div className={cx("skeleton", className)} aria-hidden="true" />;

export const Field = ({ label, error, hint, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-semibold">{label}</span>
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    {error && <span className="mt-1 block text-xs text-brick" role="alert">{error}</span>}
  </label>
);

export const PageTitle = ({ title, sub, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="font-display text-3xl leading-tight">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
    {children}
  </div>
);

export const EmptyState = ({ title, hint, action, icon = "journal-bookmark" }) => (
  <div className="px-6 py-12 text-center">
    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-2xl text-primary"><Icon name={icon} /></div>
    <p className="font-display text-lg">{title}</p>
    {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="px-6 py-10 text-center text-sm text-brick">
    {error?.status ? "The server returned an error." : "Can't reach the server."}
    {onRetry && <> <button className="underline" onClick={onRetry}>Try again</button></>}
  </div>
);

export function Pagination({ page, count, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (count <= pageSize) return null;
  return (
    <nav className="flex items-center justify-between border-t border-line px-4 py-3 text-sm" aria-label="Pagination">
      <span className="text-muted">{(page - 1) * pageSize + 1}–{Math.min(count, page * pageSize)} of {count}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <span className="px-1 text-muted">Page {page} of {pages}</span>
        <Button variant="ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </nav>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-plum/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx("w-full rounded-xl border border-line bg-surface p-6 shadow-xl", wide ? "max-w-xl" : "max-w-md")}>
        <h2 className="mb-4 font-display text-xl">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel = "Confirm", onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-6 text-sm text-muted">{body}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); onClose(); } }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
      {tabs.map(([id, label, icon]) => (
        <button key={id} role="tab" aria-selected={value === id} onClick={() => onChange(id)}
          className={cx("inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition", value === id ? "border-saffron text-ink" : "border-transparent text-muted hover:text-ink")}>
          {icon && <Icon name={icon} />}{label}
        </button>
      ))}
    </div>
  );
}
