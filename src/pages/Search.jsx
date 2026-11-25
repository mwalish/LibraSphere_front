import { useSearchParams } from "react-router-dom";
import { meta, works } from "../api/client";
import WorkCard from "../components/WorkCard";
import PageBanner from "../components/PageBanner";
import { Card, EmptyState, ErrorState, Pagination, Skeleton } from "../components/ui";
import { useApi } from "../hooks/useApi";

const PAGE_SIZE = 20;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const page = Number(params.get("page") || 1);
  const filters = { resource_type: params.get("resource_type") || "", language: params.get("language") || "",
                    branch: params.get("branch") || "", available: params.get("available") || "" };

  const { data: types } = useApi(() => meta.resourceTypes());
  const { data: branches } = useApi(() => meta.branches());
  // page + filters + search travel in ONE request
  const { data, loading, error } = useApi(() => works.list({ q, page, page_size: PAGE_SIZE, ...filters }),
    [q, page, filters.resource_type, filters.language, filters.branch, filters.available]);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: "", ...patch }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };
  const rows = data?.results ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <aside aria-label="Filters" className="space-y-4">
        <h2 className="font-display text-xl">Refine</h2>
        <label className="block text-sm font-semibold">Format
          <select className="field mt-1" value={filters.resource_type} onChange={(e) => set({ resource_type: e.target.value })}>
            <option value="">All formats</option>{types?.map((t) => <option key={t.id} value={t.code}>{t.name}</option>)}
          </select></label>
        <label className="block text-sm font-semibold">Branch
          <select className="field mt-1" value={filters.branch} onChange={(e) => set({ branch: e.target.value })}>
            <option value="">All branches</option>{branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select></label>
        <label className="block text-sm font-semibold">Language
          <select className="field mt-1" value={filters.language} onChange={(e) => set({ language: e.target.value })}>
            <option value="">Any</option><option value="en">English</option><option value="sw">Kiswahili</option>
          </select></label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--c-teal))]" checked={!!filters.available} onChange={(e) => set({ available: e.target.checked ? "1" : "" })} />
          Available now
        </label>
      </aside>
      <section>
        <PageBanner icon="search-heart" title={q ? `Results for “${q}”` : "Browse the catalog"}
          sub={data ? `${data.count} title${data.count === 1 ? "" : "s"}` : "Searching…"} />
        <Card>
          {error ? <ErrorState error={error} /> : loading && !data ? (
            <div className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-64" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState title="Nothing matched" hint="Try fewer words, or search by author or ISBN. You can also ask the librarians to add the title." />
          ) : (
            <div className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-8 p-6 sm:grid-cols-3 xl:grid-cols-4">
              {rows.map((w) => <WorkCard key={w.id} work={w} className="w-full" />)}
            </div>
          )}
          <Pagination page={page} count={data?.count ?? 0} pageSize={PAGE_SIZE} onChange={(p) => set({ page: String(p) })} />
        </Card>
      </section>
    </div>
  );
}
