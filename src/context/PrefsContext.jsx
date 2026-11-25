import { createContext, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext(null);
export const usePrefs = () => useContext(Ctx);
const DEFAULTS = { theme: "system", size: "normal", font: "default", contrast: "normal", motion: "normal", bg: "on" };

/** Theme + accessibility preferences, stored per device and applied as attributes on <html>. */
export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("ls_prefs") || "{}") }; } catch { return DEFAULTS; }
  });

  useEffect(() => {
    localStorage.setItem("ls_prefs", JSON.stringify(prefs));
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => root.classList.toggle("dark", prefs.theme === "dark" || (prefs.theme === "system" && mq.matches));
    apply();
    root.dataset.size = prefs.size;
    root.dataset.font = prefs.font;
    root.dataset.contrast = prefs.contrast;
    root.dataset.motion = prefs.motion;
    root.dataset.bg = prefs.bg;
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [prefs]);

  const value = useMemo(() => ({ prefs, set: (patch) => setPrefs((p) => ({ ...p, ...patch })), reset: () => setPrefs(DEFAULTS) }), [prefs]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
