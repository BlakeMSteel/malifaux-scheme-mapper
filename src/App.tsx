import { useEffect, useMemo, useState } from "react";
import Legend from "./components/Legend";
import Diagram from "./components/Diagram";
import AimBar from "./components/AimBar";
import ReferenceIndex from "./components/ReferenceIndex";
import { computeDistMap, computePathUnion } from "./lib/graph";
import type { AimMode } from "./lib/badges";

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);

  const mode: AimMode = selectedId
    ? "trace"
    : targets.length === 1
      ? "gradient"
      : targets.length >= 2
        ? "intersect"
        : "none";

  const distMaps = useMemo(() => {
    if (targets.length !== 1) return [];
    return [computeDistMap(targets[0])];
  }, [targets]);

  const pathUnion = useMemo(() => {
    if (targets.length < 2) return null;
    return computePathUnion(targets);
  }, [targets]);

  function selectNode(id: string) {
    setTargets([]);
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function clearSelection() {
    setSelectedId(null);
  }

  function toggleTarget(id: string) {
    setSelectedId(null);
    setTargets((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function clearAim() {
    setTargets([]);
  }

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setSelectedId(null);
        setTargets([]);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="wrap">
      <header>
        <p className="eyebrow">
          Malifaux Fourth Edition · Gaining Grounds 2025 · General Schemes
        </p>
        <h1>Malifaux Scheme Mapper</h1>
        <p className="lede">
          Each of the 21 general schemes lists three or four{" "}
          <strong>next available schemes</strong> — the only options you may
          select once that scheme is in play. All 21 share one unbroken loop
          that touches every scheme exactly once; that loop forms the ring
          below, with every other link drawn as a curve off to the side.
        </p>
        <Legend />
      </header>

      <section className="panel" aria-label="Scheme link diagram">
        <div className="panel-head">
          <p className="panel-title">The Scheme Pool</p>
          <p className="panel-hint">drag to pan · use +/&minus; to zoom</p>
        </div>
        <AimBar
          selectedId={selectedId}
          targets={targets}
          pathUnion={pathUnion}
          onRemove={toggleTarget}
          onClear={clearAim}
        />
        <Diagram
          selectedId={selectedId}
          onSelectNode={selectNode}
          onClearSelection={clearSelection}
          targets={targets}
          distMaps={distMaps}
          pathUnion={pathUnion}
        />
      </section>

      <ReferenceIndex
        selectedId={selectedId}
        targets={targets}
        mode={mode}
        distMaps={distMaps}
        pathUnion={pathUnion}
        onSelect={selectNode}
        onToggleAim={toggleTarget}
      />

      <footer>
        21 schemes · 67 next-available links · Gaining Grounds 2025 tournament
        pack
      </footer>
    </div>
  );
}
