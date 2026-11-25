import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { errorMessage, fieldErrors, members, meta } from "../../api/client";
import { Badge, Button, Card, EmptyState, Field, Icon, Modal, PageTitle, Pagination, Skeleton } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useApi } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { fmtDate } from "../../lib/format";

const TONE = { active: "good", pending: "warn", suspended: "bad", expired: "quiet" };

function WalkIn({ onClose }) {
  const toast = useToast();
  const { user } = useAuth();
  const { data: branches } = useApi(() => meta.branches());
  const mine = branches?.filter((b) => user.is_superuser || user.roles.some((r) => r.branch === b.id)) ?? [];
  const [f, setF] = useState({ full_name: "", email: "", phone: "", home_branch: "" });
  const [err, setErr] = useState({});
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr({});
    try { setCreated(await members.create({ ...f, home_branch: Number(f.home_branch) })); toast.success("Member registered"); }
    catch (er) { setErr({ ...fieldErrors(er), _: errorMessage(er) }); }
  };
  if (created) {
    return (
      <Modal title="Member registered" onClose={onClose}>
        <p className="text-sm">Card number <strong>{created.member_no}</strong></p>
        <p className="mt-2 text-sm">Temporary password (shown once): <code className="rounded bg-line/60 px-2 py-0.5">{created.temporary_password}</code></p>
        <div className="mt-5 flex justify-end"><Button onClick={onClose}>Done</Button></div>
      </Modal>
    );
  }
  return (
    <Modal title="Register a walk-in member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Full name" error={err.full_name}><input className="field" required autoFocus value={f.full_name} onChange={set("full_name")} /></Field>
        <Field label="Email" error={err.email}><input className="field" type="email" required value={f.email} onChange={set("email")} /></Field>
        <Field label="Phone"><input className="field" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Home branch" error={err.home_branch}><select className="field" required value={f.home_branch} onChange={set("home_branch")}><option value="">Choose…</option>{mine.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        {err._ && <p className="text-sm text-brick" role="alert">{err._}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button>Register</Button></div>
      </form>
    </Modal>
  );
}

export default function Members() {
  const { isManager } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(params.get("status") || "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const q = useDebounce(search.trim());
  useEffect(() => setPage(1), [q, status]);
  const { data, loading } = useApi(() => members.list({ search: q, status, page, page_size: 15 }), [q, status, page]);

  const act = (fn, ok) => async (m) => { try { await fn(m.id); toast.success(ok); } catch (e) { toast.error(errorMessage(e)); } };
  const approve = act(members.approve, "Membership approved"), suspend = act(members.suspend, "Member suspended");

  return (
    <>
      <PageTitle title="Members" sub="Approve sign-ups and register walk-ins"><Button onClick={() => setAdding(true)}><Icon name="person-plus" /> Register walk-in</Button></PageTitle>
      <Card>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <input className="field max-w-xs" type="search" placeholder="Name, email or member number" aria-label="Search members" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="field w-auto" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option><option value="pending">Pending approval</option><option value="active">Active</option><option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem]">
            <thead className="border-b border-line"><tr>{["Member", "Name", "Branch", "Status", "Expires", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {loading && !data && Array.from({ length: 5 }, (_, i) => <tr key={i}><td colSpan={6} className="td"><Skeleton className="h-5" /></td></tr>)}
              {data?.results.map((m) => (
                <tr key={m.id}>
                  <td className="td font-mono text-xs">{m.member_no}</td>
                  <td className="td"><span className="font-semibold">{m.full_name}</span><br /><span className="text-xs text-muted">{m.email}</span></td>
                  <td className="td">{m.home_branch_name}</td>
                  <td className="td"><Badge tone={TONE[m.status]}>{m.status}</Badge></td>
                  <td className="td">{fmtDate(m.expires_at)}</td>
                  <td className="td space-x-3 text-right text-xs font-semibold">
                    {isManager && m.status !== "active" && <Button variant="link" onClick={() => approve(m)}>{m.status === "pending" ? "Approve" : "Reactivate"}</Button>}
                    {isManager && m.status === "active" && <Button variant="dangerLink" onClick={() => suspend(m)}>Suspend</Button>}
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
        {!loading && !data?.results.length && <EmptyState title="No members match" />}
        <Pagination page={page} count={data?.count ?? 0} pageSize={15} onChange={setPage} />
      </Card>
      {adding && <WalkIn onClose={() => setAdding(false)} />}
    </>
  );
}
