import { useSearchParams } from "react-router-dom";
import { reports } from "../../api/client";
import { Badge, Card, EmptyState, PageTitle, Skeleton, Tabs } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { fmtDate } from "../../lib/format";

const COLUMNS = {
  overdue: [["Title", (r) => r.title], ["Member", (r) => `${r.member_name} (${r.member_no})`], ["Branch", (r) => r.branch],
            ["Due", (r) => fmtDate(r.due_at)], ["", (r) => <Badge tone="bad">{r.days_overdue}d late</Badge>]],
  "most-borrowed": [["Title", (r) => r.title], ["Loans (90 days)", (r) => r.loans]],
  "new-arrivals": [["Title", (r) => r.title], ["Copies added (30 days)", (r) => r.copies]],
  "membership-growth": [["Month", (r) => fmtDate(r.month)], ["New members", (r) => r.new_members]],
};

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overdue";
  const { data, loading } = useApi(() => reports.get(tab), [tab]);
  const cols = COLUMNS[tab] ?? COLUMNS.overdue;
  return (
    <>
      <PageTitle title="Reports" sub="Scoped to the branches you work at" />
      <Tabs value={tab} onChange={(t) => setParams({ tab: t })} tabs={[["overdue", "Overdue"], ["most-borrowed", "Most borrowed"], ["new-arrivals", "New arrivals"], ["membership-growth", "Membership growth"]]} />
      <Card className="overflow-x-auto">
        {loading && !data ? <div className="p-5"><Skeleton className="h-24" /></div> : !data?.length ? <EmptyState title="Nothing to report yet" /> : (
          <table className="w-full min-w-[32rem]">
            <thead className="border-b border-line"><tr>{cols.map(([h], i) => <th key={i} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{data.map((r, i) => <tr key={i}>{cols.map(([, f], j) => <td key={j} className="td">{f(r)}</td>)}</tr>)}</tbody>
          </table>)}
      </Card>
    </>
  );
}
