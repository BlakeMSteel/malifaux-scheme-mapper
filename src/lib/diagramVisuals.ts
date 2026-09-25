import { SCHEMES } from "../data/schemes";
import { EDGES, edgeKey, type Edge, type PathUnion } from "./graph";
import { closestMatch, reachingSourceIndices, type AimMode } from "./badges";
import { HOP_STYLES } from "./hopStyles";

export interface NodeStyle {
  fill?: string;
  labelFill?: string;
  opacity?: number;
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface EdgeStyle {
  stroke?: string;
  opacity?: number;
  strokeWidth?: number;
}

export interface DiagramVisuals {
  nodeStyles: Record<string, NodeStyle>;
  edgeStyles: Record<string, EdgeStyle>;
}

const EMPTY_VISUALS: DiagramVisuals = { nodeStyles: {}, edgeStyles: {} };
const UNREACHABLE_NODE_STYLE: NodeStyle = { opacity: 0.16, radius: 6 };
const DIMMED_NODE_STYLE: NodeStyle = { opacity: 0.13, radius: 6 };
const CHAIN_WAYPOINT_STYLE: NodeStyle = {
  fill: "var(--ink)",
  opacity: 1,
  radius: 8,
};
const CHAIN_START_STYLE: NodeStyle = {
  fill: "#fff",
  labelFill: "var(--ink)",
  opacity: 1,
  radius: 8,
  stroke: "var(--ink)",
  strokeWidth: 2.5,
};
const ON_CHAIN_EDGE_STYLE: EdgeStyle = {
  stroke: "var(--ink)",
  opacity: 1,
  strokeWidth: 2.6,
};
const OFF_CHAIN_EDGE_STYLE: EdgeStyle = { opacity: 0.04 };

function markerNodeStyle(colorVar: string, dashed: boolean): NodeStyle {
  return {
    fill: colorVar,
    opacity: 1,
    radius: 10,
    stroke: "var(--ink)",
    strokeWidth: 3,
    strokeDasharray: dashed ? "3 2" : undefined,
  };
}

function hopNodeStyle(distance: number, colorVar: string): NodeStyle {
  const style = HOP_STYLES[distance];
  return {
    fill: colorVar,
    opacity: style.nodeOpacity,
    radius: style.nodeRadius,
    stroke: distance === 0 ? "var(--ink)" : undefined,
    strokeWidth: distance === 0 ? 3 : undefined,
  };
}

function hopEdgeStyle(distance: number, colorVar: string): EdgeStyle {
  const style = HOP_STYLES[distance];
  return {
    stroke: colorVar,
    opacity: style.edgeOpacity,
    strokeWidth: style.edgeWidth,
  };
}

function closestForwardEdge(
  edge: Edge,
  sourceCount: number,
  hopsFromSources: (Record<string, number> | null)[],
): { sourceIndex: number; hopsFromSource: number } | null {
  let best: { sourceIndex: number; hopsFromSource: number } | null = null;
  for (let sourceIndex = 0; sourceIndex < sourceCount; sourceIndex++) {
    const distanceMap = hopsFromSources[sourceIndex];
    const hopsFromSource = distanceMap?.[edge.source];
    const hopsToTarget = distanceMap?.[edge.target];
    const targetIsOneHopFarther =
      hopsFromSource !== undefined && hopsToTarget === hopsFromSource + 1;
    if (
      targetIsOneHopFarther &&
      (best === null || hopsFromSource! < best.hopsFromSource)
    ) {
      best = { sourceIndex, hopsFromSource: hopsFromSource! };
    }
  }
  return best;
}

function toTargetGradientVisuals(
  distanceToTarget: Record<string, number> | null | undefined,
): DiagramVisuals {
  const nodeStyles: Record<string, NodeStyle> = {};
  SCHEMES.forEach((scheme) => {
    const distance = distanceToTarget?.[scheme.id];
    nodeStyles[scheme.id] =
      distance === undefined
        ? UNREACHABLE_NODE_STYLE
        : hopNodeStyle(distance, "var(--target-0)");
  });

  const edgeStyles: Record<string, EdgeStyle> = {};
  EDGES.forEach((edge) => {
    const hopsFromSourceSide = distanceToTarget?.[edge.source];
    const hopsFromTargetSide = distanceToTarget?.[edge.target];
    const onShortestPath =
      hopsFromTargetSide !== undefined &&
      hopsFromSourceSide === hopsFromTargetSide + 1;
    edgeStyles[edgeKey(edge.source, edge.target)] = onShortestPath
      ? hopEdgeStyle(hopsFromSourceSide!, "var(--target-0)")
      : OFF_CHAIN_EDGE_STYLE;
  });

  return { nodeStyles, edgeStyles };
}

function fromSourcesGradientVisuals(
  sourceCount: number,
  hopsFromSources: (Record<string, number> | null)[],
): DiagramVisuals {
  const nodeStyles: Record<string, NodeStyle> = {};
  SCHEMES.forEach((scheme) => {
    const closest = closestMatch(scheme.id, sourceCount, hopsFromSources);
    nodeStyles[scheme.id] = closest
      ? hopNodeStyle(closest.dist, `var(--target-${closest.ti})`)
      : UNREACHABLE_NODE_STYLE;
  });

  const edgeStyles: Record<string, EdgeStyle> = {};
  EDGES.forEach((edge) => {
    const closest = closestForwardEdge(edge, sourceCount, hopsFromSources);
    edgeStyles[edgeKey(edge.source, edge.target)] = closest
      ? hopEdgeStyle(
          closest.hopsFromSource,
          `var(--target-${closest.sourceIndex})`,
        )
      : OFF_CHAIN_EDGE_STYLE;
  });

  return { nodeStyles, edgeStyles };
}

function intersectVisuals(
  targets: string[],
  pathUnion: PathUnion | null,
): DiagramVisuals {
  const nodeStyles: Record<string, NodeStyle> = {};
  SCHEMES.forEach((scheme) => {
    const targetIndex = targets.indexOf(scheme.id);
    if (targetIndex !== -1) {
      nodeStyles[scheme.id] = markerNodeStyle(
        `var(--target-${targetIndex})`,
        false,
      );
    } else if (pathUnion?.startSet.has(scheme.id)) {
      nodeStyles[scheme.id] = CHAIN_START_STYLE;
    } else if (pathUnion?.nodeSet.has(scheme.id)) {
      nodeStyles[scheme.id] = CHAIN_WAYPOINT_STYLE;
    } else {
      nodeStyles[scheme.id] = DIMMED_NODE_STYLE;
    }
  });

  const edgeStyles: Record<string, EdgeStyle> = {};
  EDGES.forEach((edge) => {
    const key = edgeKey(edge.source, edge.target);
    edgeStyles[key] = pathUnion?.edgeSet.has(key)
      ? ON_CHAIN_EDGE_STYLE
      : OFF_CHAIN_EDGE_STYLE;
  });

  return { nodeStyles, edgeStyles };
}

function targetNodeStyle(
  schemeId: string,
  targetIndex: number,
  targetReach: Record<string, number[]>,
): NodeStyle {
  const reachingSources = targetReach[schemeId] ?? [];
  if (reachingSources.length === 0) {
    return markerNodeStyle(`var(--target-${targetIndex})`, false);
  }
  if (reachingSources.length === 1) {
    return markerNodeStyle(`var(--target-${reachingSources[0]})`, false);
  }
  return {
    ...markerNodeStyle(`url(#target-split-${schemeId})`, false),
    labelFill: "var(--ink)",
  };
}

function combinedVisuals(
  targets: string[],
  sources: string[],
  pathUnion: PathUnion | null,
  targetReach: Record<string, number[]>,
): DiagramVisuals {
  const nodeStyles: Record<string, NodeStyle> = {};
  SCHEMES.forEach((scheme) => {
    const targetIndex = targets.indexOf(scheme.id);
    const sourceIndex = sources.indexOf(scheme.id);
    if (targetIndex !== -1) {
      nodeStyles[scheme.id] = targetNodeStyle(
        scheme.id,
        targetIndex,
        targetReach,
      );
    } else if (sourceIndex !== -1) {
      nodeStyles[scheme.id] = markerNodeStyle(
        `var(--target-${sourceIndex})`,
        true,
      );
    } else if (pathUnion?.nodeSet.has(scheme.id)) {
      nodeStyles[scheme.id] = CHAIN_WAYPOINT_STYLE;
    } else {
      nodeStyles[scheme.id] = DIMMED_NODE_STYLE;
    }
  });

  const edgeStyles: Record<string, EdgeStyle> = {};
  EDGES.forEach((edge) => {
    const key = edgeKey(edge.source, edge.target);
    edgeStyles[key] = pathUnion?.edgeSet.has(key)
      ? ON_CHAIN_EDGE_STYLE
      : OFF_CHAIN_EDGE_STYLE;
  });

  return { nodeStyles, edgeStyles };
}

export function computeTargetReach(
  targets: string[],
  hopsFromSources: (Record<string, number> | null)[],
): Record<string, number[]> {
  const targetReach: Record<string, number[]> = {};
  targets.forEach((targetId) => {
    targetReach[targetId] = reachingSourceIndices(targetId, hopsFromSources);
  });
  return targetReach;
}

export function computeDiagramVisuals(
  mode: AimMode,
  params: {
    targets: string[];
    sources: string[];
    hopsFromSources: (Record<string, number> | null)[];
    pathUnion: PathUnion | null;
    hopsToTargets: (Record<string, number> | null)[];
    targetReach: Record<string, number[]>;
  },
): DiagramVisuals {
  switch (mode) {
    case "toGradient":
      return toTargetGradientVisuals(params.hopsToTargets[0]);
    case "fromGradient":
      return fromSourcesGradientVisuals(
        params.sources.length,
        params.hopsFromSources,
      );
    case "toIntersect":
      return intersectVisuals(params.targets, params.pathUnion);
    case "combined":
      return combinedVisuals(
        params.targets,
        params.sources,
        params.pathUnion,
        params.targetReach,
      );
    default:
      return EMPTY_VISUALS;
  }
}
