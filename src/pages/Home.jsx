import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { me, works } from "../api/client";
import WorkCard from "../components/WorkCard";
import { Badge, Card, Icon, Skeleton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { dueLabel } from "../lib/format";
import { bgImage } from "../lib/backgrounds";

function Shelf({ title, icon, request, deps, animate }) {
  const { data, loading } = useApi(request, deps);
  const rows = Array.isArray(data) ? data : data?.results ?? [];
  if (!loading && rows.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-2xl"><span className="grid h-9 w-9 place-items-center rounded-lg bg-saffron text-lg text-[#1E1233]"><Icon name={icon} /></span>{title}</h2>
      <div className="no-scrollbar -mx-5 flex gap-5 overflow-x-auto px-5 pb-3">
        {loading && !data
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64 w-36 shrink-0 sm:w-40" />)
          : rows.map((w, i) => <WorkCard key={w.id} work={w} className={animate ? "shelf-in" : ""} style={animate ? { animationDelay: `${i * 60}ms` } : undefined} />)}
      </div>
    </section>
  );
}

/** What matters first for a signed-in member: what's ready and what's due. */
function ForYou() {
  const { data: holds } = useApi(() => me.holds());
  const { data: loans } = useApi(() => me.loans());
  const ready = holds?.filter((h) => h.status === "ready") ?? [];
  const soon = loans?.filter((l) => new Date(l.due_at) - Date.now() < 3 * 86_400_000) ?? [];
  if (!ready.length && !soon.length) return null;
  return (
    <Card className="mb-10 border-saffron p-5">
      <h2 className="mb-3 font-display text-xl">Needs your attention</h2>
      <ul className="space-y-2 text-sm">
        {ready.map((h) => (
          <li key={`h${h.id}`} className="flex flex-wrap items-center gap-2">
            <Badge tone="good"><Icon name="bag-check-fill" /> Ready for pickup</Badge><span className="font-semibold">{h.title}</span>
            <span className="text-muted">at {h.pickup_branch_name}</span>
          </li>))}
        {soon.map((l) => (
          <li key={`l${l.id}`} className="flex flex-wrap items-center gap-2">
            <Badge tone={l.status === "overdue" ? "bad" : "warn"}>{dueLabel(l.due_at)}</Badge>
            <span className="font-semibold">{l.title}</span>
          </li>))}
      </ul>
      <Link to="/me" className="mt-3 inline-block text-sm font-semibold text-teal">Manage my loans →</Link>
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <>
      <section className="relative mb-10 overflow-hidden rounded-2xl bg-plum text-white shadow-xl">
        <div aria-hidden="true" className="backdrop-img absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bgImage("hero") }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgb(46 16 84 / .94), rgb(46 16 84 / .62) 58%, rgb(14 159 142 / .35))" }} />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
        <h1 className="max-w-xl font-display text-4xl leading-tight sm:text-5xl">Find your next <span className="text-saffron">good read</span>.</h1>
        <p className="mt-3 max-w-lg text-white/80">Search every branch, reserve a copy, renew from your phone.</p>
        <form className="mt-6 flex max-w-xl gap-2" role="search" onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(q.trim())}`); }}>
          <input className="field !border-white/20 !bg-white !text-[#241826] placeholder:!text-[#6b5a70]" type="search" placeholder="Title, author, ISBN or subject" aria-label="Search the catalog" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="inline-flex items-center gap-2 rounded-md bg-saffron px-5 text-sm font-bold text-[#1E1233]"><Icon name="search" /> Search</button>
        </form>
        </div>
      </section>
      {user?.member?.status === "pending" && (
        <Card className="mb-8 border-saffron p-4 text-sm">Your membership is waiting for approval. You can browse the catalog now, and borrowing opens once a librarian approves you.</Card>)}
      {user?.member && <ForYou />}
      <Shelf title="New arrivals" icon="stars" request={() => works.list({ ordering: "-created_at", page_size: 12 })} animate />
      <Shelf title="Popular this season" icon="fire" request={() => works.popular()} />
    </>
  );
}
