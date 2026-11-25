import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, me, tokens } from "../api/client";
import { isManagerUser, isStaffUser } from "../lib/format";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!tokens.access);

  const logout = useCallback(async () => { await auth.logout(); setUser(null); }, []);

  useEffect(() => {
    const drop = () => setUser(null);
    if (tokens.access) me.get().then(setUser).catch(drop).finally(() => setReady(true));
    window.addEventListener("ls:logout", drop);
    return () => window.removeEventListener("ls:logout", drop);
  }, []);

  const login = useCallback(async (email, password) => {
    await auth.login(email, password);
    setUser(await me.get());
  }, []);

  const value = useMemo(() => ({
    user, ready, login, logout, setUser,
    isStaff: isStaffUser(user), isManager: isManagerUser(user),
  }), [user, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
