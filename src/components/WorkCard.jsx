import { Link } from "react-router-dom";
import { Badge, Icon, cx } from "./ui";

const COVERS = ["#5B2A86", "#0E9F8E", "#E0752E", "#2F5BD9", "#C2306B", "#2B8A3E"];
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Cover image, or a typeset cover generated from the title so shelves never look empty. */
export function BookCover({ work, className }) {
  if (work.cover_url) {
    return <img src={work.cover_url} alt="" loading="lazy" className={cx("aspect-[2/3] w-full rounded-md object-cover shadow-md", className)} />;
  }
  const bg = COVERS[hash(work.title) % COVERS.length];
  return (
    <div className={cx("flex aspect-[2/3] w-full flex-col justify-between rounded-md p-3 text-white shadow-md", className)} style={{ background: bg }} aria-hidden="true">
      <span className="font-display text-base leading-tight sm:text-lg">{work.title}</span>
      <span className="text-[11px] uppercase tracking-wider opacity-80">{work.creators?.[0]}</span>
    </div>
  );
}

export function Availability({ work }) {
  if (!work.total_copies) return <Badge><Icon name="dash-circle" /> Not on shelf</Badge>;
  return work.available_copies > 0
    ? <Badge tone="good"><Icon name="check-circle-fill" /> {work.available_copies} available</Badge>
    : <Badge tone="warn"><Icon name="hourglass-split" /> Join the waitlist</Badge>;
}

export default function WorkCard({ work, style, className }) {
  return (
    <Link to={`/book/${work.id}`} style={style} className={cx("group block w-36 shrink-0 sm:w-40", className)}>
      <div className="transition group-hover:-translate-y-1"><BookCover work={work} /></div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug group-hover:underline">{work.title}</p>
      <p className="truncate text-xs text-muted">{work.creators?.join(", ")}</p>
      <div className="mt-1.5"><Availability work={work} /></div>
    </Link>
  );
}
