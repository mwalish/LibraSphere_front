import { bgImage } from "../lib/backgrounds";
import { Icon } from "./ui";

/** Image header for a page: icon chip, title, subtitle, optional actions. */
export default function PageBanner({ icon, title, sub, children }) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-plum text-white shadow-lg">
      <div aria-hidden="true" className="backdrop-img absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bgImage("banner") }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgb(46 16 84 / .93), rgb(46 16 84 / .6) 60%, rgb(14 159 142 / .4))" }} />
      <div className="relative flex flex-wrap items-center gap-4 px-6 py-7 sm:px-8">
        {icon && <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-saffron text-2xl text-[#1E1233]"><Icon name={icon} /></span>}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl leading-tight">{title}</h1>
          {sub && <p className="mt-1 text-sm text-white/80" aria-live="polite">{sub}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
