import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { auth, errorMessage, fieldErrors, meta } from "../api/client";
import { Button, Field } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { bgImage } from "../lib/backgrounds";

/** Split card: an image panel with a line of copy, and the form. */
function AuthShell({ quote, children }) {
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl md:grid-cols-[1fr_1.15fr]">
      <div className="relative hidden min-h-[28rem] bg-plum md:block">
        <div aria-hidden="true" className="backdrop-img absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bgImage("auth") }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(to top, rgb(46 16 84 / .96), rgb(46 16 84 / .5) 55%, rgb(46 16 84 / .15))" }} />
        <div className="relative flex h-full flex-col justify-end p-8 text-white">
          <p className="font-display text-2xl leading-snug">{quote}</p>
          <p className="mt-3 text-sm text-white/70">LibraSphere</p>
        </div>
      </div>
      <div className="p-7 sm:p-10">{children}</div>
    </div>
  );
}

export function Login() {
  const { user, login, isStaff } = useAuth();
  const location = useLocation();
  const [f, setF] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={location.state?.from || (isStaff ? "/staff" : "/")} replace />;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { await login(f.email, f.password); }
    catch (err) { setError(err.status === 401 ? "Wrong email or password" : errorMessage(err)); }
    finally { setBusy(false); }
  };
  return (
    <AuthShell quote="A room without books is like a body without a soul.">
      <h1 className="font-display text-3xl">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Sign in to see your loans, holds and reading.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="field" type="email" autoComplete="email" required autoFocus value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input className="field" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        {error && <p className="text-sm text-brick" role="alert">{error}</p>}
        <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">New here? <Link className="font-semibold text-teal" to="/register">Join the library</Link></p>
    </AuthShell>
  );
}

export function Register() {
  const { data: branches } = useApi(() => meta.branches());
  const [f, setF] = useState({ full_name: "", email: "", phone: "", password: "", home_branch: "" });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({});
    try { setDone(await auth.register({ ...f, home_branch: Number(f.home_branch) })); }
    catch (err) { setErrors({ ...fieldErrors(err), _: errorMessage(err) }); }
    finally { setBusy(false); }
  };
  if (done) {
    return (
      <AuthShell quote="Today a reader, tomorrow a leader.">
        <h1 className="font-display text-3xl">You're on the list</h1>
        <p className="mt-2 text-sm text-muted">{done.detail}</p>
        <p className="mt-4 text-sm">Your member number: <strong>{done.member_no}</strong></p>
        <Link to="/login" className="mt-6 inline-block font-semibold text-teal">Go to sign in</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell quote="Today a reader, tomorrow a leader.">
      <h1 className="font-display text-3xl">Join the library</h1>
      <p className="mb-6 mt-1 text-sm text-muted">A librarian approves new memberships, usually the same day.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" error={errors.full_name}><input className="field" required value={f.full_name} onChange={set("full_name")} /></Field>
        <Field label="Email" error={errors.email}><input className="field" type="email" required value={f.email} onChange={set("email")} /></Field>
        <Field label="Phone (optional)" error={errors.phone}><input className="field" type="tel" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters, not a common password"><input className="field" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set("password")} /></Field>
        <Field label="Home branch" error={errors.home_branch}>
          <select className="field" required value={f.home_branch} onChange={set("home_branch")}>
            <option value="">Choose a branch…</option>
            {branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        {errors._ && !Object.keys(errors).filter((k) => k !== "_").length && <p className="text-sm text-brick" role="alert">{errors._}</p>}
        <Button className="w-full" disabled={busy}>{busy ? "Sending…" : "Request membership"}</Button>
      </form>
    </AuthShell>
  );
}
