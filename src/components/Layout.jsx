import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bgImage } from "../lib/backgrounds";
import AccessibilityPanel from "./AccessibilityPanel";
import Backdrop from "./Backdrop";
import { Button, Icon, cx } from "./ui";

const Logo = ({ light }) => (
  <Link to="/" className={cx("font-display text-2xl", light ? "text-white" : "text-ink")}>
    Libra<span className="text-saffron">Sphere</span>
  </Link>
);

function A11yButton({ onClick, light }) {
  return (
    <button onClick={onClick} aria-label="Display and accessibility settings" title="Display & accessibility"
      className={cx("grid h-9 w-9 place-items-center rounded-md border text-base", light ? "border-white/30 text-white" : "border-line")}><Icon name="universal-access" className="text-lg" /></button>
  );
}

/** Public + member area. */
export function PublicLayout() {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState(false);
  const [q, setQ] = useState("");
  const link = ({ isActive }) => cx("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold", isActive ? "bg-line/60" : "hover:bg-line/40");

  return (
    <div className="min-h-screen">
      <Backdrop />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-saffron focus:px-3 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-ground/90 backdrop-blur">
        <div className="brand-bar" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
          <Logo />
          <form className="order-3 w-full sm:order-none sm:ml-2 sm:w-auto sm:flex-1 sm:max-w-md" role="search"
            onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(q.trim())}`); }}>
            <input className="field" type="search" placeholder="Search title, author, ISBN or subject" aria-label="Search the catalog" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <nav className="ml-auto flex items-center gap-1" aria-label="Main">
            <NavLink to="/search" className={link}><Icon name="book" /> Catalog</NavLink>
            {user && <NavLink to="/me" className={link}><Icon name="bookmark-heart" /> My library</NavLink>}
            {isStaff && <NavLink to="/staff" className={link}><Icon name="briefcase" /> Staff</NavLink>}
            <A11yButton onClick={() => setPanel(true)} />
            {user ? <Button variant="ghost" onClick={async () => { await logout(); navigate("/"); }}><Icon name="box-arrow-right" /> Sign out</Button>
                  : <Button onClick={() => navigate("/login")}><Icon name="box-arrow-in-right" /> Sign in</Button>}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-5 py-8"><Outlet /></main>
      {panel && <AccessibilityPanel onClose={() => setPanel(false)} />}
    </div>
  );
}

/** Staff area: a quiet plum rail, big calm screens. */
export function StaffLayout() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState(false);
  const nav = [["/staff", "Today", true, "calendar2-check"], ["/staff/desk", "Desk", false, "upc-scan"],
               ["/staff/catalog", "Catalog", false, "journal-bookmark"], ["/staff/members", "Members", false, "people"],
               ["/staff/reports", "Reports", false, "bar-chart-line"]];
  const link = ({ isActive }) => cx("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition",
    isActive ? "bg-white/15 text-white shadow-[inset_3px_0_0_rgb(var(--c-saffron))]" : "text-white/75 hover:bg-white/10 hover:text-white");

  return (
    <div className="min-h-screen lg:flex">
      <aside className="relative overflow-hidden bg-plum px-4 py-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col">
        <div aria-hidden="true" className="backdrop-img absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: bgImage("rail") }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgb(var(--c-plum) / .86), rgb(var(--c-plum) / .97))" }} />
        <div className="relative mb-5 flex items-center justify-between px-3 lg:mb-8">
          <Logo light />
          <span className="lg:hidden"><A11yButton light onClick={() => setPanel(true)} /></span>
        </div>
        <nav className="relative flex gap-1 overflow-x-auto lg:flex-col" aria-label="Staff">
          {nav.map(([to, label, end, icon]) => <NavLink key={to} to={to} end={end} className={link}><Icon name={icon} className="text-base" /> {label}</NavLink>)}
        </nav>
        <div className="relative mt-4 hidden border-t border-white/15 px-3 pt-4 text-sm lg:mt-auto lg:block">
          <p className="truncate font-semibold">{user?.full_name || user?.email}</p>
          <p className="mb-3 text-xs text-white/70">{user?.is_superuser ? "Super admin" : isManager ? "Branch manager" : "Librarian"}</p>
          <div className="flex items-center gap-2">
            <A11yButton light onClick={() => setPanel(true)} />
            <Link to="/" className="text-white/80 underline">Public site</Link>
            <button className="ml-auto text-white/80 underline" onClick={async () => { await logout(); navigate("/"); }}><Icon name="box-arrow-right" /> Sign out</button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-6 lg:px-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
      {panel && <AccessibilityPanel onClose={() => setPanel(false)} />}
    </div>
  );
}
