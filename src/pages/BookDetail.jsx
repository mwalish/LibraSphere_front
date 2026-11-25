import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { errorMessage, holds, items, meta, works } from "../api/client";
import { BookCover } from "../components/WorkCard";
import { Badge, Button, Card, Icon, Skeleton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useApi } from "../hooks/useApi";

function AddCopies({ work }) {
  const toast = useToast();
  const { data: branches } = useApi(() => meta.branches());
  const [f, setF] = useState({ edition: work.editions[0]?.id ?? "", branch: "", count: 1, shelf_location: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      for (let i = 0; i < Number(f.count); i++) await items.create({ edition: Number(f.edition), branch: Number(f.branch), shelf_location: f.shelf_location });
      toast.success(`${f.count} cop${f.count == 1 ? "y" : "ies"} added`);
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Card className="mt-8 p-5">
      <h2 className="mb-3 font-display text-xl">Staff: add copies</h2>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-5">
        <select className="field" value={f.edition} onChange={(e) => setF({ ...f, edition: e.target.value })} aria-label="Edition">
          {work.editions.map((e) => <option key={e.id} value={e.id}>{e.resource_type_name}{e.year ? ` ${e.year}` : ""}</option>)}
        </select>
        <select className="field" required value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })} aria-label="Branch">
          <option value="">Branch…</option>{branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input className="field" type="number" min="1" max="20" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} aria-label="Number of copies" />
        <input className="field" placeholder="Shelf" value={f.shelf_location} onChange={(e) => setF({ ...f, shelf_location: e.target.value })} aria-label="Shelf location" />
        <Button disabled={busy || !f.edition}>Add</Button>
      </form>
    </Card>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const { user, isStaff } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: work, loading, error } = useApi(() => works.get(id), [id]);
  const { data: avail } = useApi(() => works.availability(id), [id]);
  const [busy, setBusy] = useState(null);

  const hold = async (branch) => {
    if (!user) return navigate("/login", { state: { from: `/book/${id}` } });
    setBusy(branch.branch);
    try {
      const h = await holds.create({ work: Number(id), pickup_branch: branch.branch });
      toast.success(h.status === "ready" ? `A copy is waiting for you at ${branch.branch_name}` : `You're #${h.position} in the queue at ${branch.branch_name}`);
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  };

  if (error) return <p className="text-brick">We couldn't find that title. <Link className="underline" to="/search">Back to the catalog</Link></p>;
  if (loading && !work) return <div className="grid gap-8 md:grid-cols-[16rem_1fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;

  return (
    <article className="grid gap-8 md:grid-cols-[16rem_1fr]">
      <div className="mx-auto w-48 md:w-full"><BookCover work={work} /></div>
      <div>
        <h1 className="font-display text-4xl leading-tight">{work.title}</h1>
        {work.subtitle && <p className="mt-1 text-lg text-muted">{work.subtitle}</p>}
        <p className="mt-2 text-sm">by <span className="font-semibold">{work.creators.join(", ") || "Unknown"}</span></p>
        <div className="mt-3 flex flex-wrap gap-2">{work.subjects.map((s) => <Badge key={s.id}>{s.name}</Badge>)}</div>
        {work.description && <p className="mt-5 max-w-prose leading-relaxed">{work.description}</p>}

        <h2 className="mb-3 mt-8 font-display text-2xl">Availability</h2>
        <Card className="divide-y divide-line">
          {!avail ? <div className="p-4"><Skeleton className="h-6" /></div> : avail.length === 0 ? (
            <p className="p-4 text-sm text-muted">No copies are on the shelf right now.</p>
          ) : avail.map((b) => (
            <div key={b.branch} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{b.branch_name}</p>
                <p className="text-sm text-muted">{b.available} of {b.total} on the shelf</p>
              </div>
              {b.available > 0 ? <Badge tone="good">Available</Badge> : <Badge tone="warn">All out</Badge>}
              {(!user || user.member) && (
                <Button variant={b.available > 0 ? "primary" : "accent"} disabled={busy === b.branch} onClick={() => hold(b)}>
                  <Icon name={b.available > 0 ? "bookmark-plus" : "hourglass-split"} /> {b.available > 0 ? "Reserve a copy" : "Join waitlist"}
                </Button>)}
            </div>))}
        </Card>

        <h2 className="mb-3 mt-8 font-display text-2xl">Editions</h2>
        <ul className="space-y-1 text-sm">
          {work.editions.map((e) => (
            <li key={e.id}><Badge>{e.resource_type_name}</Badge> <span className="ml-2 text-muted">{[e.publisher, e.year, e.isbn13 && `ISBN ${e.isbn13}`].filter(Boolean).join(" · ")}</span></li>))}
        </ul>
        {isStaff && <AddCopies work={work} />}
      </div>
    </article>
  );
}
