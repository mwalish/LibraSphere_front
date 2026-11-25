import { bgImage } from "../lib/backgrounds";

/** Full-page image behind public pages, washed with the page colour so text stays readable. */
export default function Backdrop({ name = "page" }) {
  return (
    <div aria-hidden="true" className="backdrop-img pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bgImage(name) }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgb(var(--c-ground) / .80), rgb(var(--c-ground) / .95) 55%)" }} />
    </div>
  );
}
