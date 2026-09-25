import { useMemo } from "react";
import { Box } from "@mui/material";
import { SCHEMES } from "../data/schemes";
import { byId, edgeKey, EDGES, incoming, type PathUnion } from "../lib/graph";
import { aimMode } from "../lib/badges";
import {
  computeDiagramVisuals,
  computeTargetReach,
  type EdgeStyle,
} from "../lib/diagramVisuals";
import {
  CENTER,
  NODE_LAYOUT,
  RING_RADIUS,
  VIEWBOX,
  longChordPath,
  ringPath,
  shortChordPath,
} from "../lib/layout";
import DiagramDefs from "./DiagramDefs";
import DiagramNode from "./DiagramNode";

const MAX_WIDTH = 800;
const MIN_LEGIBLE_WIDTH = 640;

const TRACE_DIMMED_CHORD_OPACITY = 0.06;
const TRACE_DIMMED_RING_OPACITY = 0.15;

interface DiagramProps {
  selectedId: string | null;
  onSelectNode: (id: string) => void;
  onClearSelection: () => void;
  targets: string[];
  sources: string[];
  hopsFromSources: (Record<string, number> | null)[];
  pathUnion: PathUnion | null;
  hopsToTargets: (Record<string, number> | null)[];
}

function traceAwareOpacity(
  edgeStyle: EdgeStyle | undefined,
  tracedNeighborhood: Set<string> | null,
  source: string,
  target: string,
  dimmedOpacity: number,
): number | undefined {
  const isOutsideTracedNeighborhood =
    tracedNeighborhood !== null &&
    !(tracedNeighborhood.has(source) && tracedNeighborhood.has(target));
  return isOutsideTracedNeighborhood ? dimmedOpacity : edgeStyle?.opacity;
}

export default function Diagram({
  selectedId,
  onSelectNode,
  onClearSelection,
  targets,
  sources,
  hopsFromSources,
  pathUnion,
  hopsToTargets,
}: DiagramProps) {
  const mode = aimMode(selectedId, targets, sources);

  const targetReach = useMemo(() => {
    if (mode !== "combined") return {};
    return computeTargetReach(targets, hopsFromSources);
  }, [mode, targets, hopsFromSources]);

  const visuals = useMemo(
    () =>
      computeDiagramVisuals(mode, {
        targets,
        sources,
        hopsFromSources,
        pathUnion,
        hopsToTargets,
        targetReach,
      }),
    [
      mode,
      targets,
      sources,
      hopsFromSources,
      pathUnion,
      hopsToTargets,
      targetReach,
    ],
  );

  const tracedNeighborhood = useMemo(() => {
    if (mode !== "trace" || !selectedId) return null;
    const neighborhood = new Set<string>([selectedId]);
    byId[selectedId].next.forEach((id) => neighborhood.add(id));
    incoming[selectedId].forEach((id) => neighborhood.add(id));
    return neighborhood;
  }, [mode, selectedId]);

  function edgeClassName(
    baseClassName: string,
    source: string,
    target: string,
  ): string {
    const classNames = [baseClassName];
    if (mode === "trace") {
      if (source === selectedId) classNames.push("hi-out");
      if (target === selectedId) classNames.push("hi-in");
    }
    return classNames.join(" ");
  }

  function clearSelectionUnlessNodeWasClicked(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if ((event.target as HTMLElement).closest(".node")) return;
    onClearSelection();
  }

  return (
    <Box
      onClick={clearSelectionUnlessNodeWasClicked}
      sx={{
        display: "flex",
        justifyContent: { xs: "flex-start", md: "center" },
        pt: 1.25,
        pb: 2.5,
      }}
    >
      <svg
        className={"wheel-svg" + (mode === "trace" ? " has-selection" : "")}
        style={{
          width: "100%",
          minWidth: MIN_LEGIBLE_WIDTH,
          maxWidth: MAX_WIDTH,
          height: "auto",
        }}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        role="img"
        aria-label="Circular map of all 21 schemes: the outer ring is the discovered Hamiltonian cycle, and inner/outer curves are every other next-available link."
      >
        <DiagramDefs targets={targets} targetReach={targetReach} />

        <g className="chords">
          {EDGES.filter((edge) => edge.kind !== "ring").map((edge) => {
            const kind = edge.kind as "short" | "long";
            const key = edgeKey(edge.source, edge.target);
            const category = byId[edge.source].cat;
            const pathData =
              kind === "short"
                ? shortChordPath(edge.source, edge.target, edge.steps)
                : longChordPath(edge.source, edge.target, edge.steps);
            return (
              <path
                key={key}
                className={edgeClassName(
                  kind === "short"
                    ? "chord-edge chord-short"
                    : "chord-edge chord-long",
                  edge.source,
                  edge.target,
                )}
                data-cat={category}
                d={pathData}
                markerEnd={`url(#arrow-${category})`}
                style={{
                  stroke: visuals.edgeStyles[key]?.stroke,
                  strokeWidth: visuals.edgeStyles[key]?.strokeWidth,
                  opacity: traceAwareOpacity(
                    visuals.edgeStyles[key],
                    tracedNeighborhood,
                    edge.source,
                    edge.target,
                    TRACE_DIMMED_CHORD_OPACITY,
                  ),
                }}
              />
            );
          })}
        </g>
        <g className="ring">
          {EDGES.filter((edge) => edge.kind === "ring").map((edge) => {
            const key = edgeKey(edge.source, edge.target);
            return (
              <path
                key={key}
                className={edgeClassName("ring-edge", edge.source, edge.target)}
                d={ringPath(edge.source, edge.target)}
                markerEnd="url(#arrow-ring)"
                style={{
                  stroke: visuals.edgeStyles[key]?.stroke,
                  strokeWidth: visuals.edgeStyles[key]?.strokeWidth,
                  opacity: traceAwareOpacity(
                    visuals.edgeStyles[key],
                    tracedNeighborhood,
                    edge.source,
                    edge.target,
                    TRACE_DIMMED_RING_OPACITY,
                  ),
                }}
              />
            );
          })}
        </g>
        <g className="nodes">
          {SCHEMES.map((scheme) => (
            <DiagramNode
              key={scheme.id}
              scheme={scheme}
              layout={NODE_LAYOUT[scheme.id]}
              style={visuals.nodeStyles[scheme.id]}
              isSelected={scheme.id === selectedId}
              isDimmedByTrace={
                tracedNeighborhood !== null &&
                !tracedNeighborhood.has(scheme.id)
              }
              onSelect={onSelectNode}
            />
          ))}
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
