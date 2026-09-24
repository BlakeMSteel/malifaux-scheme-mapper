import { CAT_LABEL, type Scheme } from "../data/schemes";
import { byId, incoming, type PathUnion } from "../lib/graph";
import { hopBadges, type AimMode } from "../lib/badges";

const AIM_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="6.5" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <line x1="12" y1="1.5" x2="12" y2="4.5" />
    <line x1="12" y1="19.5" x2="12" y2="22.5" />
    <line x1="1.5" y1="12" x2="4.5" y2="12" />
    <line x1="19.5" y1="12" x2="22.5" y2="12" />
  </svg>
);

interface SchemeCardProps {
  scheme: Scheme;
  isActive: boolean;
  targetIndex: number;
  targetsFull: boolean;
  mode: AimMode;
  targets: string[];
  distMaps: (Record<string, number> | null)[];
  pathUnion: PathUnion | null;
  onSelect: (id: string) => void;
  onToggleAim: (id: string) => void;
}

function chipRow(label: string, ids: string[]) {
  if (!ids.length) return null;
  return (
    <>
      <div className="chip-label">{label}</div>
      <div className="chip-row">
        {ids.map((id) => (
          <span className="chip" key={id}>
            {byId[id].name}
          </span>
        ))}
      </div>
    </>
  );
}

export default function SchemeCard({
  scheme,
  isActive,
  targetIndex,
  targetsFull,
  mode,
  targets,
  distMaps,
  pathUnion,
  onSelect,
  onToggleAim,
}: SchemeCardProps) {
  const badges = hopBadges(scheme.id, mode, targets, distMaps, pathUnion);
  const aimStyle =
    targetIndex !== -1
      ? {
          background: `var(--target-${targetIndex})`,
          borderColor: "transparent",
        }
      : undefined;

  return (
    <article
      className={"card" + (isActive ? " active" : "")}
      data-cat={scheme.cat}
      onClick={() => onSelect(scheme.id)}
    >
      <div className="card-top">
        <div className="card-name-group">
          <span className="card-name">{scheme.name}</span>
          <span className="card-badge">{CAT_LABEL[scheme.cat]}</span>
        </div>
        <button
          className="aim-toggle"
          type="button"
          aria-pressed={targetIndex !== -1}
          aria-label={`Aim for ${scheme.name}`}
          title={`Aim for ${scheme.name}`}
          style={aimStyle}
          disabled={targetIndex === -1 && targetsFull}
          onClick={(ev) => {
            ev.stopPropagation();
            onToggleAim(scheme.id);
          }}
        >
          {AIM_ICON}
        </button>
      </div>

      {badges.length > 0 && (
        <div className="hop-badges">
          {badges.map((b) => (
            <span
              key={b.key}
              className={"hop-badge" + (b.muted ? " muted" : "")}
              style={b.colorVar ? { background: b.colorVar } : undefined}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="card-reveal">{scheme.reveal}</div>
      <div className="card-scoring">
        <b>Score</b> {scheme.scoring} <b>Bonus</b> {scheme.bonus}
      </div>

      {chipRow("Next available", scheme.next)}
      {chipRow("Leads here from", incoming[scheme.id])}
    </article>
  );
}
