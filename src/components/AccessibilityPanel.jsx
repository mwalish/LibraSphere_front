import { usePrefs } from "../context/PrefsContext";
import { Button, Modal, cx } from "./ui";

function Choice({ label, value, options, onChange }) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
            className={cx("rounded-md border px-3 py-1.5 text-sm", value === v ? "border-saffron bg-saffron/25 font-semibold" : "border-line")}>
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function AccessibilityPanel({ onClose }) {
  const { prefs, set, reset } = usePrefs();
  return (
    <Modal title="Display & accessibility" onClose={onClose}>
      <Choice label="Theme" value={prefs.theme} onChange={(theme) => set({ theme })} options={[["system", "Match device"], ["light", "Light"], ["dark", "Dark"]]} />
      <Choice label="Text size" value={prefs.size} onChange={(size) => set({ size })} options={[["normal", "Normal"], ["large", "Large"]]} />
      <Choice label="Font" value={prefs.font} onChange={(font) => set({ font })} options={[["default", "Standard"], ["easy", "Easy reading (dyslexia-friendly)"]]} />
      <Choice label="Contrast" value={prefs.contrast} onChange={(contrast) => set({ contrast })} options={[["normal", "Normal"], ["high", "High"]]} />
      <Choice label="Motion" value={prefs.motion} onChange={(motion) => set({ motion })} options={[["normal", "Normal"], ["reduce", "Reduce"]]} />
      <Choice label="Background images" value={prefs.bg} onChange={(bg) => set({ bg })} options={[["on", "Show"], ["off", "Hide"]]} />
      <div className="mt-2 flex justify-between">
        <Button variant="link" onClick={reset}>Reset</Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
