import { byId, type PathUnion } from "../lib/graph";

interface AimBarProps {
  selectedId: string | null;
  targets: string[];
  pathUnion: PathUnion | null;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function AimBar({
  selectedId,
  targets,
  pathUnion,
  onRemove,
  onClear,
}: AimBarProps) {
  let hint: string;
  if (selectedId) {
    hint =
      "tracing " +
      byId[selectedId].name +
      " — solid = leads to · dashed = led here from · click again or press Escape to clear";
  } else if (targets.length === 0) {
    hint =
      "tap a scheme to trace it, or mark up to 3 targets below to aim for them";
  } else if (targets.length === 1) {
    hint =
      "colored by hops to your target · brighter = closer · dim = out of reach within 3";
  } else if (pathUnion && pathUnion.matchCount > 0) {
    hint =
      pathUnion.matchCount +
      (pathUnion.matchCount === 1 ? " chain of " : " chains of ") +
      "≤4 schemes include all " +
      targets.length +
      " targets together · highlighted = on one of them";
  } else {
    hint =
      "no chain of ≤4 schemes includes all " +
      targets.length +
      " targets together — try removing one";
  }

  const warn =
    targets.length >= 2 && (!pathUnion || pathUnion.matchCount === 0);

  return (
    <>
      <p className={"aim-status" + (warn ? " warn" : "")}>{hint}</p>
      <div className="aim-strip">
        <span className="aim-label">Aiming for</span>
        {targets.map((id, ti) => (
          <span className="aim-chip" key={id}>
            <span
              className="aim-chip-dot"
              style={{ background: `var(--target-${ti})` }}
            />
            {byId[id].name}
            <button
              className="aim-chip-remove"
              type="button"
              aria-label={`Remove ${byId[id].name} from targets`}
              onClick={() => onRemove(id)}
            >
              &times;
            </button>
          </span>
        ))}
        {targets.length === 0 && (
          <span className="aim-empty-hint">
            mark up to 3 schemes below with the target button
          </span>
        )}
        {targets.length > 0 && (
          <button className="aim-clear" type="button" onClick={onClear}>
            clear
          </button>
        )}
      </div>
    </>
  );
}
