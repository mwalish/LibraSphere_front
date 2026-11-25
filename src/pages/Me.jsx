import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { errorMessage, holds as holdsApi, me } from "../api/client";
import PageBanner from "../components/PageBanner";
import { Badge, Button, Card, EmptyState, Icon, Skeleton, Tabs } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useApi } from "../hooks/useApi";
import { dueLabel, fmtDate, money } from "../lib/format";

function Loans() {
  const toast = useToast();
  const { data, loading } = useApi(() => me.loans());
  const renew = async (l) => {
    try { const r = await me.renew(l.id); toast.success(`Renewed. New due date: ${fmtDate(r.due_at)}`); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  if (loading && !data) return <Skeleton className="h-24" />;
  if (!data?.length) return <EmptyState title="Nothing on loan" hint="Browse the catalog and reserve something good." />;
  return (
    <ul className="divide-y divide-line">
      {data.map((l) => (
        <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="min-w-0 flex-1"><p className="font-semibold">{l.title}</p><p className="text-sm text-muted">{l.branch_name} · due {fmtDate(l.due_at)}</p></div>
          <Badge tone={l.status === "overdue" ? "bad" : new Date(l.due_at) - Date.now() < 3 * 86_400_000 ? "warn" : "good"}>{dueLabel(l.due_at)}</Badge>
          <Button variant="ghost" onClick={() => renew(l)}><Icon name="arrow-repeat" /> Renew</Button>
        </li>))}
    </ul>
  );
}

function Holds() {
  const toast = useToast();
  const { data, loading } = useApi(() => me.holds());
  const cancel = async (h) => { try { await holdsApi.cancel(h.id); toast.success("Hold cancelled"); } catch (e) { toast.error(errorMessage(e)); } };
  if (loading && !data) return <Skeleton className="h-24" />;
  if (!data?.length) return <EmptyState title="No holds" hint="Reserve a title from its page and it'll appear here." />;
  return (
    <ul className="divide-y divide-line">
      {data.map((h) => (
        <li key={h.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="min-w-0 flex-1"><p className="font-semibold">{h.title}</p>
            <p className="text-sm text-muted">Pickup at {h.pickup_branch_name}{h.status === "ready" ? ` · collect by ${fmtDate(h.expires_at)}` : ""}</p></div>
          {h.status === "ready" ? <Badge tone="good">Ready for pickup</Badge> : <Badge tone="warn">#{h.position} in queue</Badge>}
          <Button variant="dangerLink" onClick={() => cancel(h)}>Cancel</Button>
        </li>))}
    </ul>
  );
}

function Fines() {
  const { data, loading } = useApi(() => me.fines());
  if (loading && !data) return <Skeleton className="h-24" />;
  return (
    <div className="p-5">
      <p className="text-sm text-muted">Total owed</p>
      <p className="font-display text-4xl">{money(data?.total_owed)}</p>
      <p className="mt-1 text-sm text-muted">Pay at any branch desk. Online payment is coming soon.</p>
      <ul className="mt-5 divide-y divide-line">
        {data?.fines.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="min-w-0 flex-1">{f.title || "Fee"} · {f.reason}</span>
            <span>{money(f.balance)}</span>
            <Badge tone={f.status === "open" ? "bad" : "quiet"}>{f.status}</Badge>
          </li>))}
      </ul>
    </div>
  );
}

function History({ keep }) {
  const { data, loading } = useApi(() => me.loans({ history: 1 }));
  if (loading && !data) return <Skeleton className="h-24" />;
  return (
    <div>
      <p className="border-b border-line px-5 py-3 text-sm text-muted">{keep ? "Your reading history is saved." : "Past loans are removed from your record after 30 days. Turn on “Keep my reading history” in Settings to save them."}</p>
      {!data?.length ? <EmptyState title="No past loans yet" /> : (
        <ul className="divide-y divide-line">
          {data.map((l) => <li key={l.id} className="flex justify-between gap-3 px-5 py-3 text-sm"><span className="font-semibold">{l.title}</span><span className="text-muted">returned {fmtDate(l.returned_at)}</span></li>)}
        </ul>)}
    </div>
  );
}

function Card_({ member, name }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="rounded-xl bg-white p-4"><QRCodeSVG value={member.member_no} size={176} /></div>
      <div><p className="font-display text-2xl">{name}</p><p className="text-sm text-muted">{member.tier ?? "Member"} · {member.home_branch_name}</p>
        <p className="mt-1 font-mono text-lg tracking-wider">{member.member_no}</p></div>
      <p className="max-w-xs text-xs text-muted">Show this at any branch desk to borrow. It also works on a phone screen.</p>
    </div>
  );
}

function Settings({ member }) {
  const toast = useToast();
  const { setUser } = useAuth();
  const { data: notes } = useApi(() => me.notifications());
  const toggle = async (e) => {
    try { setUser(await me.patch({ keep_history: e.target.checked })); toast.success("Saved"); } catch (err) { toast.error(errorMessage(err)); }
  };
  return (
    <div className="space-y-6 p-5">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--c-teal))]" checked={!!member.keep_history} onChange={toggle} />
        <span><span className="font-semibold">Keep my reading history</span><br /><span className="text-muted">Off by default for your privacy. Staff never see your past loans.</span></span>
      </label>
      <div>
        <h3 className="mb-2 font-semibold">Recent notifications</h3>
        {!notes?.results?.length ? <p className="text-sm text-muted">Nothing yet.</p> : (
          <ul className="space-y-2 text-sm">{notes.results.slice(0, 8).map((n) => <li key={n.id} className="text-muted"><span className="font-semibold text-ink">{n.payload.title || n.type}</span> · {n.type.replace("_", " ")}</li>)}</ul>)}
      </div>
    </div>
  );
}

export default function Me() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "loans";
  const m = user.member;
  if (!m) return <EmptyState title="This is a staff-only account" hint="Staff accounts don't have a member card. Use the Staff area." />;
  return (
    <>
      <PageBanner icon="person-heart" title={`Hello, ${user.full_name?.split(" ")[0] || "reader"}`} sub={`Member ${m.member_no} · ${m.status === "active" ? "membership active" : m.status}`} />
      <Tabs value={tab} onChange={(t) => setParams({ tab: t })} tabs={[["loans", "Loans", "book"], ["holds", "Holds", "bookmark-star"], ["fines", "Fines", "cash-coin"], ["history", "History", "clock-history"], ["card", "Library card", "qr-code"], ["settings", "Settings", "gear"]]} />
      <Card>
        {tab === "loans" && <Loans />}{tab === "holds" && <Holds />}{tab === "fines" && <Fines />}
        {tab === "history" && <History keep={m.keep_history} />}{tab === "card" && <Card_ member={m} name={user.full_name} />}
        {tab === "settings" && <Settings member={m} />}
      </Card>
    </>
  );
}
