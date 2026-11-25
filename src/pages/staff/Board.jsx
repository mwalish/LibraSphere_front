import { Link } from "react-router-dom";
import { holds, reports } from "../../api/client";
import PageBanner from "../../components/PageBanner";
import { Badge, Card, EmptyState, Icon, Skeleton } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { fmtDate } from "../../lib/format";

function Tile({ label, value, to, tone, icon }) {
  const alert = tone === "bad" && value > 0;
  const body = (
    <Card className={`flex items-center gap-4 p-5 transition hover:-translate-y-0.5 ${alert ? "border-brick" : ""}`}>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${alert ? "bg-brick/15 text-brick" : "bg-primary/10 text-primary"}`}><Icon name={icon} /></span>
      <div>
        <p className="font-display text-3xl leading-none">{value ?? <Skeleton className="inline-block h-8 w-12" />}</p>
        <p className="mt-1 text-sm text-muted">{label}</p>
      </div>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function Board() {
  const { data: t } = useApi(() => reports.get("today"));
  const { data: ready } = useApi(() => holds.list({ status: "ready", page_size: 8 }));
  const { data: overdue } = useApi(() => reports.get("overdue"));

  return (
    <>
      <PageBanner icon="calendar2-check" title="Today" sub="What needs doing at the desk right now" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile icon="journal-arrow-up" label="Items on loan" value={t?.active_loans} />
        <Tile icon="alarm" label="Overdue" value={t?.overdue} tone="bad" to="/staff/reports?tab=overdue" />
        <Tile icon="calendar-event" label="Due today" value={t?.due_today} />
        <Tile icon="bag-check" label="Holds waiting on the shelf" value={t?.holds_ready} />
        <Tile icon="box-arrow-up-right" label="Checked out today" value={t?.checkouts_today} />
        <Tile icon="box-arrow-in-down-left" label="Returned today" value={t?.returns_today} />
        <Tile icon="person-check" label="Memberships to approve" value={t?.members_pending} to="/staff/members?status=pending" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 font-display text-xl"><Icon name="bag-check" className="text-teal" /> Holds ready for pickup</h2>
          {!ready?.results?.length ? <EmptyState icon="bag" title="No holds waiting" /> : (
            <ul className="divide-y divide-line">
              {ready.results.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                  <span className="min-w-0 flex-1"><strong>{h.title}</strong><br /><span className="text-muted">for {h.member_name} · {h.pickup_branch_name}</span></span>
                  <Badge tone="warn">by {fmtDate(h.expires_at)}</Badge>
                </li>))}
            </ul>)}
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 font-display text-xl"><Icon name="alarm" className="text-brick" /> Longest overdue</h2>
          {!overdue?.length ? <EmptyState icon="emoji-smile" title="Nothing overdue" /> : (
            <ul className="divide-y divide-line">
              {overdue.slice(0, 8).map((o) => (
                <li key={o.loan} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                  <span className="min-w-0 flex-1"><strong>{o.title}</strong><br /><span className="text-muted">{o.member_name} · {o.member_no}</span></span>
                  <Badge tone="bad">{o.days_overdue}d late</Badge>
                </li>))}
            </ul>)}
        </Card>
      </div>
    </>
  );
}
