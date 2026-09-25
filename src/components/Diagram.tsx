import { useMemo } from "react";
import { Box } from "@mui/material";
import { SCHEMES } from "../data/schemes";
import { byId, EDGES, incoming, type PathUnion } from "../lib/graph";
import {
  closestMatch,
  reachingSourceIndices,
  type AimMode,
} from "../lib/badges";
import {
  CENTER,
  NODE_LAYOUT,
  RING_RADIUS,
  VIEWBOX,
  longChordPath,
  ringPath,
  shortChordPath,
} from "../lib/layout";

const HOP_NODE_R = [11, 9, 8, 7];
const HOP_NODE_OPACITY = [1, 1, 0.75, 0.55];
const HOP_EDGE_OPACITY = [0, 1, 0.7, 0.45];
const HOP_EDGE_WIDTH = [0, 2.6, 2, 1.5];

const MAX_WIDTH = 800;

interface DiagramProps {
  selectedId: string | null;
  onSelectNode: (id: string) => void;
  onClearSelection: () => void;
  targets: string[];
  sources: string[];
  distMaps: (Record<string, number> | null)[];
  pathUnion: PathUnion | null;
  targetBackwardDistMaps: (Record<string, number> | null)[];
}

export default function Diagram({
  selectedId,
  onSelectNode,
  onClearSelection,
  targets,
  sources,
  distMaps,
  pathUnion,
  targetBackwardDistMaps,
}: DiagramProps) {
  const combined = targets.length >= 1 && sources.length >= 1;
  const mode: AimMode = selectedId
    ? "trace"
    : combined
      ? "combined"
      : targets.length === 1
        ? "toGradient"
        : targets.length >= 2
          ? "toIntersect"
          : sources.length >= 1
            ? "fromGradient"
            : "none";

  // Which selected sources can actually reach each selected target, within
  // budget — used to color a target by its reaching source(s) rather than
  // by its own arbitrary position in the targets list.
  const targetReach = useMemo(() => {
    const out: Record<string, number[]> = {};
    if (mode !== "combined") return out;
    targets.forEach((t) => {
      out[t] = reachingSourceIndices(t, distMaps);
    });
    return out;
  }, [mode, targets, distMaps]);

  const nodeVisual = useMemo(() => {
    const out: Record<
      string,
      {
        fill?: string;
        labelFill?: string;
        opacity?: number;
        r?: number;
        stroke?: string;
        strokeWidth?: number;
        strokeDasharray?: string;
      }
    > = {};

    if (mode === "toGradient") {
      const dm = targetBackwardDistMaps[0];
      SCHEMES.forEach((s) => {
        const d = dm?.[s.id];
        if (d === undefined) {
          out[s.id] = { opacity: 0.16, r: 6 };
        } else {
          out[s.id] = {
            fill: "var(--target-0)",
            opacity: HOP_NODE_OPACITY[d],
            r: HOP_NODE_R[d],
            stroke: d === 0 ? "var(--ink)" : undefined,
            strokeWidth: d === 0 ? 3 : undefined,
          };
        }
      });
    } else if (mode === "fromGradient") {
      // Origins are independent, not a shared path — each node takes the
      // color/distance of whichever selected source reaches it fastest.
      SCHEMES.forEach((s) => {
        const best = closestMatch(s.id, sources.length, distMaps);
        if (!best) {
          out[s.id] = { opacity: 0.16, r: 6 };
        } else {
          out[s.id] = {
            fill: `var(--target-${best.ti})`,
            opacity: HOP_NODE_OPACITY[best.dist],
            r: HOP_NODE_R[best.dist],
            stroke: best.dist === 0 ? "var(--ink)" : undefined,
            strokeWidth: best.dist === 0 ? 3 : undefined,
          };
        }
      });
    } else if (mode === "toIntersect") {
      SCHEMES.forEach((s) => {
        const ti = targets.indexOf(s.id);
        if (ti !== -1) {
          out[s.id] = {
            fill: `var(--target-${ti})`,
            opacity: 1,
            r: 10,
            stroke: "var(--ink)",
            strokeWidth: 3,
          };
        } else if (pathUnion?.nodeSet.has(s.id)) {
          out[s.id] = { fill: "var(--ink)", opacity: 1, r: 8 };
        } else {
          out[s.id] = { opacity: 0.13, r: 6 };
        }
      });
    } else if (mode === "combined") {
      // Precedence: the selected sources/targets themselves (solid ring =
      // target, dashed ring = source, since they can share a color index) >
      // the chain connecting a source to all targets — which already
      // includes nodes past a target, as far as the 4-scheme-from-source
      // cap allows (see the note in lib/badges.ts). No separate
      // independent "beyond" gradient: that would grant a fresh 3-hop
      // budget from the target regardless of how much the source→target
      // leg already spent.
      SCHEMES.forEach((s) => {
        const ti = targets.indexOf(s.id);
        const si = sources.indexOf(s.id);
        if (ti !== -1) {
          const reach = targetReach[s.id] ?? [];
          const fill =
            reach.length === 0
              ? `var(--target-${ti})` // no selected source reaches it within budget
              : reach.length === 1
                ? `var(--target-${reach[0]})`
                : `url(#target-split-${s.id})`;
          out[s.id] = {
            fill,
            labelFill: reach.length >= 2 ? "var(--ink)" : fill,
            opacity: 1,
            r: 10,
            stroke: "var(--ink)",
            strokeWidth: 3,
          };
        } else if (si !== -1) {
          out[s.id] = {
            fill: `var(--target-${si})`,
            opacity: 1,
            r: 10,
            stroke: "var(--ink)",
            strokeWidth: 3,
            strokeDasharray: "3 2",
          };
        } else if (pathUnion?.nodeSet.has(s.id)) {
          out[s.id] = { fill: "var(--ink)", opacity: 1, r: 8 };
        } else {
          out[s.id] = { opacity: 0.13, r: 6 };
        }
      });
    }
    return out;
  }, [
    mode,
    distMaps,
    targets,
    sources,
    pathUnion,
    targetBackwardDistMaps,
    targetReach,
  ]);

  const edgeVisual = useMemo(() => {
    const out: Record<
      string,
      { stroke?: string; opacity?: number; strokeWidth?: number }
    > = {};

    if (mode === "toGradient") {
      const dm = targetBackwardDistMaps[0];
      EDGES.forEach((e) => {
        const key = e.source + ">" + e.target;
        const du = dm?.[e.source];
        const dv = dm?.[e.target];
        // dist = hops-to-target, so u->v is "on the way" when v is one hop
        // closer to the target than u.
        if (dv !== undefined && du === dv + 1) {
          out[key] = {
            stroke: "var(--target-0)",
            opacity: HOP_EDGE_OPACITY[du],
            strokeWidth: HOP_EDGE_WIDTH[du],
          };
        } else {
          out[key] = { opacity: 0.04 };
        }
      });
    } else if (mode === "fromGradient") {
      EDGES.forEach((e) => {
        const key = e.source + ">" + e.target;
        let best: { ti: number; level: number } | null = null;
        for (let ti = 0; ti < sources.length; ti++) {
          const dm = distMaps[ti];
          const du = dm?.[e.source];
          const dv = dm?.[e.target];
          // dist = hops-from-source, so u->v is "on the way" when v is one
          // hop farther from that source than u.
          if (du !== undefined && dv === du + 1) {
            if (best === null || du < best.level) best = { ti, level: dv };
          }
        }
        if (best) {
          out[key] = {
            stroke: `var(--target-${best.ti})`,
            opacity: HOP_EDGE_OPACITY[best.level],
            strokeWidth: HOP_EDGE_WIDTH[best.level],
          };
        } else {
          out[key] = { opacity: 0.04 };
        }
      });
    } else if (mode === "toIntersect") {
      EDGES.forEach((e) => {
        const key = e.source + ">" + e.target;
        if (pathUnion?.edgeSet.has(key)) {
          out[key] = { stroke: "var(--ink)", opacity: 1, strokeWidth: 2.6 };
        } else {
          out[key] = { opacity: 0.04 };
        }
      });
    } else if (mode === "combined") {
      EDGES.forEach((e) => {
        const key = e.source + ">" + e.target;
        if (pathUnion?.edgeSet.has(key)) {
          out[key] = { stroke: "var(--ink)", opacity: 1, strokeWidth: 2.6 };
        } else {
          out[key] = { opacity: 0.04 };
        }
      });
    }
    return out;
  }, [mode, distMaps, sources, targets, pathUnion, targetBackwardDistMaps]);

  const connected = useMemo(() => {
    if (mode !== "trace" || !selectedId) return null;
    const set = new Set<string>([selectedId]);
    byId[selectedId].next.forEach((n) => set.add(n));
    incoming[selectedId].forEach((n) => set.add(n));
    return set;
  }, [mode, selectedId]);

  function edgeClass(
    kind: "ring" | "short" | "long",
    source: string,
    target: string,
  ) {
    const cls = [
      kind === "ring"
        ? "ring-edge"
        : kind === "short"
          ? "chord-edge chord-short"
          : "chord-edge chord-long",
    ];
    if (mode === "trace") {
      if (source === selectedId) cls.push("hi-out");
      if (target === selectedId) cls.push("hi-in");
    }
    return cls.join(" ");
  }

  function onBackgroundClick(ev: React.MouseEvent<HTMLDivElement>) {
    if ((ev.target as HTMLElement).closest(".node")) return;
    onClearSelection();
  }

  return (
    <Box
      onClick={onBackgroundClick}
      sx={{
        display: "flex",
        justifyContent: "center",
        pt: 1.25,
        pb: 2.5,
      }}
    >
      <svg
        className={"wheel-svg" + (mode === "trace" ? " has-selection" : "")}
        style={{ width: "100%", maxWidth: MAX_WIDTH, height: "auto" }}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        role="img"
        aria-label="Circular map of all 21 schemes: the outer ring is the discovered Hamiltonian cycle, and inner/outer curves are every other next-available link."
      >
        <defs>
          {(["ring", "condition", "enemy", "turn"] as const).map((k) => (
            <marker
              key={k}
              id={`arrow-${k}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth={k === "ring" ? 7 : 6}
              markerHeight={k === "ring" ? 7 : 6}
              orient="auto-start-reverse"
            >
              <path
                d="M0,0 L10,5 L0,10 z"
                fill={k === "ring" ? "var(--ink-muted)" : `var(--cat-${k})`}
                opacity={k === "ring" ? 0.8 : 0.55}
              />
            </marker>
          ))}
          {targets
            .filter((t) => (targetReach[t]?.length ?? 0) >= 2)
            .map((t) => {
              const colors = targetReach[t].map((si) => `var(--target-${si})`);
              const n = colors.length;
              return (
                <linearGradient
                  key={`grad-${t}`}
                  id={`target-split-${t}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  {colors.flatMap((c, i) => [
                    <stop
                      key={`${i}-start`}
                      offset={`${(i / n) * 100}%`}
                      stopColor={c}
                    />,
                    <stop
                      key={`${i}-end`}
                      offset={`${((i + 1) / n) * 100}%`}
                      stopColor={c}
                    />,
                  ])}
                </linearGradient>
              );
            })}
        </defs>

        <g className="chords">
          {EDGES.filter((e) => e.kind !== "ring").map((e) => {
            const key = e.source + ">" + e.target;
            const cat = byId[e.source].cat;
            const d =
              e.kind === "short"
                ? shortChordPath(e.source, e.target, e.steps)
                : longChordPath(e.source, e.target, e.steps);
            const v = edgeVisual[key];
            const connectedDim =
              connected &&
              !(connected.has(e.source) && connected.has(e.target));
            return (
              <path
                key={key}
                className={edgeClass(e.kind, e.source, e.target)}
                data-cat={cat}
                d={d}
                markerEnd={`url(#arrow-${cat})`}
                style={{
                  stroke: v?.stroke,
                  opacity: v?.opacity,
                  strokeWidth: v?.strokeWidth,
                  ...(connectedDim ? { opacity: 0.06 } : {}),
                }}
              />
            );
          })}
        </g>
        <g className="ring">
          {EDGES.filter((e) => e.kind === "ring").map((e) => {
            const key = e.source + ">" + e.target;
            const v = edgeVisual[key];
            const connectedDim =
              connected &&
              !(connected.has(e.source) && connected.has(e.target));
            return (
              <path
                key={key}
                className={edgeClass(e.kind, e.source, e.target)}
                d={ringPath(e.source, e.target)}
                markerEnd="url(#arrow-ring)"
                style={{
                  stroke: v?.stroke,
                  opacity: v?.opacity,
                  strokeWidth: v?.strokeWidth,
                  ...(connectedDim ? { opacity: 0.15 } : {}),
                }}
              />
            );
          })}
        </g>
        <g className="nodes">
          {SCHEMES.map((s) => {
            const layout = NODE_LAYOUT[s.id];
            const nv = nodeVisual[s.id];
            const dimByTrace = connected && !connected.has(s.id);
            return (
              <g
                key={s.id}
                className={"node" + (s.id === selectedId ? " active" : "")}
                data-cat={s.cat}
                tabIndex={0}
                role="button"
                aria-label={s.name}
                onClick={() => onSelectNode(s.id)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onSelectNode(s.id);
                  }
                }}
                style={{ opacity: dimByTrace ? 0.35 : undefined }}
              >
                <circle
                  className="node-dot"
                  cx={layout.x}
                  cy={layout.y}
                  r={nv?.r ?? 7}
                  style={{
                    fill: nv?.fill,
                    opacity: nv?.opacity,
                    stroke: nv?.stroke,
                    strokeWidth: nv?.strokeWidth,
                    strokeDasharray: nv?.strokeDasharray,
                  }}
                />
                <text
                  className="node-label"
                  x={layout.labelX}
                  y={layout.labelY}
                  textAnchor={layout.labelAnchor}
                  transform={`rotate(${layout.labelRotation.toFixed(1)} ${layout.labelX.toFixed(1)} ${layout.labelY.toFixed(1)})`}
                  style={{
                    opacity: nv?.opacity,
                    fill: nv?.labelFill ?? nv?.fill,
                  }}
                >
                  {s.name}
                </text>
              </g>
            );
          })}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="none"
            pointerEvents="none"
          />
        </g>
      </svg>
    </Box>
  );
}
