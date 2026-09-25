import { byId, type PathUnion } from "./graph";

export type AimMode =
  | "none"
  | "trace"
  | "toGradient"
  | "toIntersect"
  | "fromGradient"
  | "combined";

export function aimMode(
  selectedId: string | null,
  targets: string[],
  sources: string[],
): AimMode {
  if (selectedId) return "trace";
  if (targets.length >= 1 && sources.length >= 1) return "combined";
  if (targets.length === 1) return "toGradient";
  if (targets.length >= 2) return "toIntersect";
  if (sources.length >= 1) return "fromGradient";
  return "none";
}

export interface AimContext {
  mode: AimMode;
  targets: string[];
  sources: string[];
  hopsFromSources: (Record<string, number> | null)[];
  pathUnion: PathUnion | null;
  hopsToTargets: (Record<string, number> | null)[];
  hopsFromTargets: (Record<string, number> | null)[];
}

export interface BestMatch {
  ti: number;
  dist: number;
}

export function closestMatch(
  id: string,
  count: number,
  hopsFromSources: (Record<string, number> | null)[],
): BestMatch | null {
  let best: BestMatch | null = null;
  for (let ti = 0; ti < count; ti++) {
    const d = hopsFromSources[ti]?.[id];
    if (d !== undefined && (best === null || d < best.dist)) {
      best = { ti, dist: d };
    }
  }
  return best;
}

export function reachingSourceIndices(
  id: string,
  hopsFromSources: (Record<string, number> | null)[],
): number[] {
  const out: number[] = [];
  for (let ti = 0; ti < hopsFromSources.length; ti++) {
    if (hopsFromSources[ti]?.[id] !== undefined) out.push(ti);
  }
  return out;
}

export interface HopBadge {
  key: string;
  label: string;
  colorVar?: string;
  muted?: boolean;
}

function hopWord(count: number): string {
  return count === 1 ? "hop" : "hops";
}

function combinedHopBadges(id: string, ctx: AimContext): HopBadge[] {
  const targetIndex = ctx.targets.indexOf(id);
  if (targetIndex !== -1) {
    return [
      {
        key: "target",
        label: "selected target",
        colorVar: `var(--target-${targetIndex})`,
      },
    ];
  }
  const sourceIndex = ctx.sources.indexOf(id);
  if (sourceIndex !== -1) {
    return [
      {
        key: "source",
        label: "selected source",
        colorVar: `var(--target-${sourceIndex})`,
      },
    ];
  }
  // Regression guard: no fallback against a single target's backward
  // distance here — that only requires reaching one target, not all of them.
  if (ctx.pathUnion?.nodeSet.has(id)) {
    return [
      {
        key: "chain",
        label: "on the way from a source to the target(s)",
        colorVar: "var(--ink)",
      },
    ];
  }
  return [{ key: "none", label: "not connected here", muted: true }];
}

function intersectHopBadges(id: string, ctx: AimContext): HopBadge[] {
  const targetIndex = ctx.targets.indexOf(id);
  if (targetIndex !== -1) {
    return [
      {
        key: "target",
        label: "selected target",
        colorVar: `var(--target-${targetIndex})`,
      },
    ];
  }
  if (ctx.pathUnion?.nodeSet.has(id)) {
    return [
      { key: "chain", label: "on a connecting chain", colorVar: "var(--ink)" },
    ];
  }
  return [{ key: "none", label: "not on any qualifying chain", muted: true }];
}

function toTargetGradientHopBadges(id: string, ctx: AimContext): HopBadge[] {
  const hopsToTarget = ctx.hopsToTargets[0]?.[id];
  const hopsFromTarget = ctx.hopsFromTargets[0]?.[id];
  if (hopsToTarget === undefined && hopsFromTarget === undefined) {
    return [{ key: "oor", label: "out of reach within 3 hops", muted: true }];
  }
  if (hopsToTarget === 0) {
    return [
      {
        key: "dist",
        label: "this is your target",
        colorVar: "var(--target-0)",
      },
    ];
  }

  const targetName = byId[ctx.targets[0]].name;
  const badges: HopBadge[] = [];
  if (hopsToTarget !== undefined) {
    badges.push({
      key: "back",
      label: `${hopsToTarget} ${hopWord(hopsToTarget)} → ${targetName}`,
      colorVar: "var(--target-0)",
    });
  }
  if (hopsFromTarget !== undefined) {
    badges.push({
      key: "fwd",
      label: `${hopsFromTarget} ${hopWord(hopsFromTarget)} from ${targetName}`,
      colorVar: "var(--target-0)",
    });
  }
  return badges;
}

function fromSourcesGradientHopBadges(id: string, ctx: AimContext): HopBadge[] {
  const reachableSources = ctx.sources
    .map((sourceId, sourceIndex) => ({
      sourceIndex,
      sourceId,
      hopsFromSource: ctx.hopsFromSources[sourceIndex]?.[id],
    }))
    .filter(
      (
        entry,
      ): entry is {
        sourceIndex: number;
        sourceId: string;
        hopsFromSource: number;
      } => entry.hopsFromSource !== undefined,
    )
    .sort((a, b) => a.hopsFromSource - b.hopsFromSource);

  if (!reachableSources.length) {
    return [{ key: "oor", label: "not reachable within 3 hops", muted: true }];
  }

  return reachableSources.map((entry) => {
    const sourceName = byId[entry.sourceId].name;
    const label =
      entry.hopsFromSource === 0
        ? "this is your source"
        : `${entry.hopsFromSource} ${hopWord(entry.hopsFromSource)} from ${sourceName}`;
    return {
      key: `dist-${entry.sourceIndex}`,
      label,
      colorVar: `var(--target-${entry.sourceIndex})`,
    };
  });
}

export function hopBadges(id: string, ctx: AimContext): HopBadge[] {
  switch (ctx.mode) {
    case "combined":
      return combinedHopBadges(id, ctx);
    case "toIntersect":
      return intersectHopBadges(id, ctx);
    case "toGradient":
      return toTargetGradientHopBadges(id, ctx);
    case "fromGradient":
      return fromSourcesGradientHopBadges(id, ctx);
    default:
      return [];
  }
}

export interface RowState {
  rowTint?: string;
  isDimmed?: boolean;
  sourceButtonHopCount?: number;
  sourceButtonColor?: string;
  targetButtonHopCount?: number;
  targetButtonColor?: string;
}

const GRADIENT_ROW_OPACITY = [0.22, 0.16, 0.1, 0.06];
const GREEN_RGB = "90,163,72";

function combinedRowState(id: string, ctx: AimContext): RowState {
  if (ctx.targets.includes(id) || ctx.sources.includes(id)) return {};
  // Same regression guard as combinedHopBadges.
  if (ctx.pathUnion?.nodeSet.has(id)) {
    return { rowTint: `rgba(${GREEN_RGB},0.16)` };
  }
  return { isDimmed: true };
}

function toTargetGradientRowState(id: string, ctx: AimContext): RowState {
  const hopsToTarget = ctx.hopsToTargets[0]?.[id];
  const hopsFromTarget = ctx.hopsFromTargets[0]?.[id];
  if (hopsToTarget === undefined && hopsFromTarget === undefined)
    return { isDimmed: true };
  return {
    rowTint:
      hopsToTarget !== undefined
        ? `rgba(${GREEN_RGB},${GRADIENT_ROW_OPACITY[hopsToTarget]})`
        : `rgba(${GREEN_RGB},0.06)`,
    sourceButtonHopCount:
      hopsToTarget && hopsToTarget > 0 ? hopsToTarget : undefined,
    sourceButtonColor: "var(--target-0)",
    targetButtonHopCount:
      hopsFromTarget && hopsFromTarget > 0 ? hopsFromTarget : undefined,
    targetButtonColor: "var(--target-0)",
  };
}

function fromSourcesGradientRowState(id: string, ctx: AimContext): RowState {
  const closestSource = closestMatch(
    id,
    ctx.sources.length,
    ctx.hopsFromSources,
  );
  if (!closestSource) return { isDimmed: true };
  return {
    rowTint: `rgba(${GREEN_RGB},${GRADIENT_ROW_OPACITY[closestSource.dist]})`,
    targetButtonHopCount:
      closestSource.dist > 0 ? closestSource.dist : undefined,
    targetButtonColor: `var(--target-${closestSource.ti})`,
  };
}

function intersectRowState(id: string, ctx: AimContext): RowState {
  if (ctx.targets.includes(id)) return {};
  if (ctx.pathUnion?.nodeSet.has(id)) {
    return { rowTint: `rgba(${GREEN_RGB},0.12)` };
  }
  return { isDimmed: true };
}

export function schemeRowState(id: string, ctx: AimContext): RowState {
  switch (ctx.mode) {
    case "combined":
      return combinedRowState(id, ctx);
    case "toGradient":
      return toTargetGradientRowState(id, ctx);
    case "fromGradient":
      return fromSourcesGradientRowState(id, ctx);
    case "toIntersect":
      return intersectRowState(id, ctx);
    default:
      return {};
  }
}
