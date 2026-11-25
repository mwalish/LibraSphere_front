import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, fieldErrors, meta, works } from "../../api/client";
import { Availability } from "../../components/WorkCard";
import { Button, Card, EmptyState, Field, Icon, Modal, PageTitle, Pagination, Skeleton } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useApi } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";

const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

function AddTitle({ onClose }) {
  const toast = useToast();
  const { user } = useAuth();
  const { data: types } = useApi(() => meta.resourceTypes());
  const { data: branches } = useApi(() => meta.branches());
  const mine = branches?.filter((b) => user.is_superuser || user.roles.some((r) => r.branch === b.id)) ?? [];
  const [f, setF] = useState({ title: "", authors: "", subjects: "", language: "en", resource_type: "book", isbn13: "", publisher: "", year: "", branch: "", copies: 1, shelf: "" });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr({});
    try {
      await works.create({
        title: f.title, language: f.language, creators: list(f.authors), subjects: list(f.subjects),
        editions: [{ resource_type: f.resource_type, isbn13: f.isbn13 || null, publisher: f.publisher, year: f.year ? Number(f.year) : null,
          copies: f.branch ? [{ branch: Number(f.branch), count: Number(f.copies), shelf_location: f.shelf }] : [] }],
      });
      toast.success(`“${f.title}” added`); onClose();
    } catch (er) { setErr({ ...fieldErrors(er), _: errorMessage(er) }); } finally { setBusy(false); }
  };

  return (
    <Modal title="Add a title" onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Title" error={err.title}><input className="field" required autoFocus value={f.title} onChange={set("title")} /></Field></div>
        <Field label="Authors" hint="Comma separated"><input className="field" value={f.authors} onChange={set("authors")} /></Field>
        <Field label="Subjects" hint="Comma separated"><input className="field" value={f.subjects} onChange={set("subjects")} /></Field>
        <Field label="Format"><select className="field" value={f.resource_type} onChange={set("resource_type")}>{types?.map((t) => <option key={t.id} value={t.code}>{t.name}</option>)}</select></Field>
        <Field label="Language"><select className="field" value={f.language} onChange={set("language")}><option value="en">English</option><option value="sw">Kiswahili</option></select></Field>
        <Field label="ISBN-13 (optional)"><input className="field" value={f.isbn13} onChange={set("isbn13")} /></Field>
        <Field label="Publisher / year"><div className="flex gap-2"><input className="field" value={f.publisher} onChange={set("publisher")} /><input className="field w-24" type="number" value={f.year} onChange={set("year")} /></div></Field>
        <Field label="Add copies at"><select className="field" value={f.branch} onChange={set("branch")}><option value="">No copies yet</option>{mine.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field label="How many / shelf"><div className="flex gap-2"><input className="field w-24" type="number" min="1" max="100" value={f.copies} onChange={set("copies")} /><input className="field" value={f.shelf} onChange={set("shelf")} /></div></Field>
        {err._ && <p className="text-sm text-brick sm:col-span-2" role="alert">{err._}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={busy}>Add title</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManageCatalog() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const q = useDebounce(search.trim());
  useEffect(() => setPage(1), [q]);
  const { data, loading } = useApi(() => works.list({ q, page, page_size: 15, ordering: "-created_at" }), [q, page]);

  return (
    <>
      <PageTitle title="Catalog" sub="Add titles and copies. Duplicate ISBNs are caught automatically."><Button onClick={() => setAdding(true)}><Icon name="plus-lg" /> Add title</Button></PageTitle>
      <Card>
        <div className="border-b border-line p-4"><input className="field max-w-sm" type="search" placeholder="Search title, author, ISBN" aria-label="Search catalog" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <table className="w-full">
          <thead className="border-b border-line"><tr><th className="th">Title</th><th className="th">Authors</th><th className="th">Copies</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-line">
            {loading && !data && Array.from({ length: 5 }, (_, i) => <tr key={i}><td colSpan={4} className="td"><Skeleton className="h-5" /></td></tr>)}
            {data?.results.map((w) => (
              <tr key={w.id}>
                <td className="td font-semibold">{w.title}</td><td className="td text-muted">{w.creators.join(", ")}</td>
                <td className="td"><Availability work={w} /></td>
                <td className="td text-right"><Link className="text-sm font-semibold text-teal" to={`/book/${w.id}`}>Open</Link></td>
              </tr>))}
          </tbody>
        </table>
        {!loading && !data?.results.length && <EmptyState title="No titles found" />}
        <Pagination page={page} count={data?.count ?? 0} pageSize={15} onChange={setPage} />
      </Card>
      {adding && <AddTitle onClose={() => setAdding(false)} />}
    </>
  );
}
