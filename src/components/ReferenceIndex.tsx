import { useMemo, useState } from "react";
import { CAT_LABEL, SCHEMES, type Category } from "../data/schemes";
import type { PathUnion } from "../lib/graph";
import type { AimMode } from "../lib/badges";
import SchemeCard from "./SchemeCard";

const CATS: Category[] = ["condition", "enemy", "turn"];

interface ReferenceIndexProps {
  selectedId: string | null;
  targets: string[];
  mode: AimMode;
  distMaps: (Record<string, number> | null)[];
  pathUnion: PathUnion | null;
  onSelect: (id: string) => void;
  onToggleAim: (id: string) => void;
}

export default function ReferenceIndex({
  selectedId,
  targets,
  mode,
  distMaps,
  pathUnion,
  onSelect,
  onToggleAim,
}: ReferenceIndexProps) {
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SCHEMES.filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q);
      const matchesCat = activeCats.size === 0 || activeCats.has(s.cat);
      return matchesQuery && matchesCat;
    });
  }, [query, activeCats]);

  function toggleCat(cat: Category) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <section aria-label="Scheme reference index">
      <div className="index-head">
        <h2>Reference Index</h2>
        <span className="index-count">
          {filtered.length} {filtered.length === 1 ? "scheme" : "schemes"}
        </span>
      </div>

      <div className="search-row">
        <input
          id="search"
          type="text"
          placeholder="Search schemes by name…"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
        />
        {CATS.map((cat) => (
          <button
            key={cat}
            type="button"
            className="filter-chip"
            aria-pressed={activeCats.has(cat)}
            onClick={() => toggleCat(cat)}
          >
            <span
              className="filter-chip-dot"
              style={{ background: `var(--cat-${cat})` }}
            />
            {CAT_LABEL[cat]}
          </button>
        ))}
      </div>

      <div className="cards">
        {filtered.length === 0 ? (
          <div className="empty-state">No schemes match that search.</div>
        ) : (
          filtered.map((s) => (
            <SchemeCard
              key={s.id}
              scheme={s}
              isActive={s.id === selectedId}
              targetIndex={targets.indexOf(s.id)}
              targetsFull={targets.length >= 3}
              mode={mode}
              targets={targets}
              distMaps={distMaps}
              pathUnion={pathUnion}
              onSelect={onSelect}
              onToggleAim={onToggleAim}
            />
          ))
        )}
      </div>
    </section>
  );
}
