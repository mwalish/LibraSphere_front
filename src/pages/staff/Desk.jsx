import { useEffect, useRef, useState } from "react";
import { errorMessage, fines, holds, loans, members } from "../../api/client";
import { Badge, Button, Card, Icon, Skeleton, Tabs, cx } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { fmtDate, money } from "../../lib/format";

const ICONS = { ok: "check-circle-fill", hold: "inbox-fill", err: "exclamation-triangle-fill" };

function Banner({ flash }) {
  if (!flash) {
    return <div className="rounded-xl border border-dashed border-line p-8 text-center text-muted"><Icon name="upc-scan" className="mr-2 text-xl align-middle" />Ready. Scan to begin.</div>;
  }
  const tone = { ok: "border-teal bg-teal/10", hold: "border-saffron bg-saffron/20", err: "border-brick bg-brick/10" }[flash.type];
  return (
    <div key={flash.key} className={cx("stamp rounded-xl border-2 p-6", tone)} role="status" aria-live="assertive">
      <p className="font-display text-3xl leading-tight"><Icon name={ICONS[flash.type]} className="mr-2" />{flash.title}</p>
      {flash.detail && <p className="mt-1 text-lg">{flash.detail}</p>}
      {flash.extra && <p className="mt-2 text-sm font-semibold text-brick">{flash.extra}</p>}
    </div>
  );
}

function MemberPanel({ member, onDone }) {
  const code = member.member_no;
  const { data: active, loading } = useApi(() => loans.list({ member: code, status: "active", page_size: 50 }), [code]);
  const { data: owed } = useApi(() => fines.list({ member: code, status: "open" }), [code]);
  const { data: ready } = useApi(() => holds.list({ member: code, status: "ready" }), [code]);
  const total = owed?.results?.reduce((s, f) => s + Number(f.balance), 0) ?? 0;
  const ok = member.status === "active";
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl">{member.full_name}</p>
          <p className="text-sm text-muted">{member.member_no} · {member.tier_name ?? "No tier"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={ok ? "good" : "bad"}>{member.status}</Badge>
          {total > 0 && <Badge tone="bad">Owes {money(total)}</Badge>}
          <Button variant="ghost" onClick={onDone}>Next member</Button>
        </div>
      </div>
      {!!ready?.results?.length && (
        <p className="mt-3 rounded-md bg-saffron/20 p-3 text-sm"><strong>Holds ready:</strong> {ready.results.map((h) => h.title).join(", ")} — scan the copy from the hold shelf.</p>)}
      <h3 className="mb-2 mt-4 text-sm font-semibold text-muted">On loan now</h3>
      {loading && !active ? <Skeleton className="h-10" /> : !active?.results?.length ? <p className="text-sm text-muted">Nothing on loan.</p> : (
        <ul className="divide-y divide-line text-sm">
          {active.results.map((l) => (
            <li key={l.id} className="flex items-center gap-2 py-2"><span className="min-w-0 flex-1 truncate">{l.title}</span>
              <Badge tone={l.status === "overdue" ? "bad" : "quiet"}>due {fmtDate(l.due_at)}</Badge></li>))}
        </ul>)}
    </Card>
  );
}

/** One scan field. Scan a member card, then items to check out; or switch to Check in and scan returns. */
export default function Desk() {
  const [mode, setMode] = useState("out");
  const [member, setMember] = useState(null);
  const [flash, setFlash] = useState(null);
  const [log, setLog] = useState([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const n = useRef(0);

  useEffect(() => { input.current?.focus(); }, [mode, member, busy]);

  const show = (f) => setFlash({ ...f, key: ++n.current });
  const remember = (text, ok) => setLog((l) => [{ id: n.current, text, ok }, ...l].slice(0, 12));

  const submit = async (e) => {
    e.preventDefault();
    const value = code.trim();
    if (!value || busy) return;
    setCode(""); setBusy(true);
    try {
      if (mode === "out" && !member) {
        const m = await members.lookup(value);
        setMember(m);
        show({ type: m.status === "active" ? "ok" : "err", title: m.full_name, detail: m.status === "active" ? "Member found. Scan the books." : `Membership is ${m.status}` });
      } else if (mode === "out") {
        const loan = await loans.checkout(member.member_no, value);
        show({ type: "ok", title: loan.title, detail: `Checked out · due ${fmtDate(loan.due_at)}` });
        remember(`Out: ${loan.title} → ${member.full_name}`, true);
      } else {
        const r = await loans.checkin(value);
        const base = { title: r.loan.title, extra: r.fine ? `Fine due: ${money(r.fine)}` : null };
        if (r.action === "hold") show({ type: "hold", ...base, detail: `Place on the HOLD SHELF for ${r.hold.member_name}` });
        else show({ type: "ok", ...base, detail: `Returned · shelve at ${r.shelve_at || "its usual shelf"}` });
        remember(`In: ${r.loan.title}`, true);
      }
    } catch (err) {
      show({ type: "err", title: errorMessage(err) });
      remember(`${value}: ${errorMessage(err)}`, false);
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Tabs value={mode} onChange={(m) => { setMode(m); setFlash(null); }} tabs={[["out", "Check out", "box-arrow-up-right"], ["in", "Check in", "box-arrow-in-down-left"]]} />
      <form onSubmit={submit} className="mb-5">
        <label className="mb-1 block text-sm font-semibold" htmlFor="scan">
          {mode === "in" ? "Scan item barcode" : member ? `Scan an item for ${member.full_name}` : "Scan member card"}
        </label>
        <input id="scan" ref={input} className="field !py-4 !text-2xl" autoComplete="off" autoFocus placeholder="Scan or type, then Enter" value={code} onChange={(e) => setCode(e.target.value)} />
      </form>
      <div className="mb-5"><Banner flash={flash} /></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
        <div>{mode === "out" && member && <MemberPanel member={member} onDone={() => { setMember(null); setFlash(null); }} />}</div>
        <aside>
          <h2 className="mb-2 text-sm font-semibold text-muted">This session</h2>
          {!log.length ? <p className="text-sm text-muted">Nothing yet.</p> : (
            <ul className="space-y-1.5 text-sm">{log.map((l, i) => <li key={i} className={l.ok ? "" : "text-brick"}>{l.text}</li>)}</ul>)}
        </aside>
      </div>
    </div>
  );
}
