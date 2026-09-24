import { byId, type PathUnion } from "./graph";

// "from" (origin) mode has no *Intersect variant: unlike targets — where
// picking 2-3 asks "what chain hits all of them" — multiple origins are
// alternative starting points (you only ever play from one), so they're
// always shown as independent reachability, merged by picking whichever
// origin gets there fastest.
export type AimMode =
  | "none"
  | "trace"
  | "toGradient"
  | "toIntersect"
  | "fromGradient";

export interface BestMatch {
  ti: number;
  dist: number;
}

/** Which selected source reaches `id` fastest (smallest hop count). Written
 * as a plain loop rather than a closure-mutated `let` — TS's control-flow
 * narrowing doesn't survive a `let` being reassigned inside a nested
 * `.forEach` callback and then read afterward. */
export function bestSourceMatch(
  id: string,
  sourceCount: number,
  distMaps: (Record<string, number> | null)[],
): BestMatch | null {
  let best: BestMatch | null = null;
  for (let ti = 0; ti < sourceCount; ti++) {
    const d = distMaps[ti]?.[id];
    if (d !== undefined && (best === null || d < best.dist)) {
      best = { ti, dist: d };
    }
  }
  return best;
}

export interface HopBadge {
  key: string;
  label: string;
  colorVar?: string;
  muted?: boolean;
}

export function hopBadges(
  id: string,
  mode: AimMode,
  targets: string[],
  sources: string[],
  distMaps: (Record<string, number> | null)[],
  pathUnion: PathUnion | null,
): HopBadge[] {
  if (mode === "toIntersect") {
    const ti = targets.indexOf(id);
    if (ti !== -1) {
      return [
        {
          key: "target",
          label: "selected target",
          colorVar: `var(--target-${ti})`,
        },
      ];
    }
    if (pathUnion?.nodeSet.has(id)) {
      return [
        {
          key: "chain",
          label: "on a connecting chain",
          colorVar: "var(--ink)",
        },
      ];
    }
    return [{ key: "none", label: "not on any qualifying chain", muted: true }];
  }

  if (mode === "toGradient") {
    const dm = distMaps[0];
    const d = dm?.[id];
    if (d === undefined) {
      return [{ key: "oor", label: "out of reach within 3 hops", muted: true }];
    }
    const targetName = byId[targets[0]].name;
    const label =
      d === 0
        ? "this is your target"
        : `${d} ${d === 1 ? "hop" : "hops"} → ${targetName}`;
    return [{ key: "dist", label, colorVar: "var(--target-0)" }];
  }

  if (mode === "fromGradient") {
    const entries = sources
      .map((sid, ti) => ({ ti, sid, dist: distMaps[ti]?.[id] }))
      .filter(
        (e): e is { ti: number; sid: string; dist: number } =>
          e.dist !== undefined,
      )
      .sort((a, b) => a.dist - b.dist);
    if (!entries.length) {
      return [
        { key: "oor", label: "not reachable within 3 hops", muted: true },
      ];
    }
    return entries.map((e) => {
      const sourceName = byId[e.sid].name;
      const label =
        e.dist === 0
          ? "this is your source"
          : `${e.dist} ${e.dist === 1 ? "hop" : "hops"} from ${sourceName}`;
      return { key: `dist-${e.ti}`, label, colorVar: `var(--target-${e.ti})` };
    });
  }

  return [];
}

export interface RowState {
  /** Background tint for the collapsed row — conveys proximity/relevance
   * without adding a second line. */
  bg?: string;
  /** Dim the row's text (out of reach / not on any qualifying chain). */
  dim?: boolean;
  /** Exact hop count shown as a small badge on the target/source button —
   * only meaningful in gradient modes. */
  badge?: number;
  /** Color of that badge — matters once there are multiple origins, each
   * with its own color. */
  badgeColor?: string;
}

const GRADIENT_ROW_OPACITY = [0.22, 0.16, 0.1, 0.06];
const GREEN_RGB = "90,163,72";

export function schemeRowState(
  id: string,
  mode: AimMode,
  targets: string[],
  sources: string[],
  distMaps: (Record<string, number> | null)[],
  pathUnion: PathUnion | null,
): RowState {
  if (mode === "toGradient") {
    const d = distMaps[0]?.[id];
    if (d === undefined) return { dim: true };
    return {
      bg: `rgba(${GREEN_RGB},${GRADIENT_ROW_OPACITY[d]})`,
      badge: d > 0 ? d : undefined,
      badgeColor: "var(--target-0)",
    };
  }

  if (mode === "fromGradient") {
    const best = bestSourceMatch(id, sources.length, distMaps);
    if (!best) return { dim: true };
    return {
      bg: `rgba(${GREEN_RGB},${GRADIENT_ROW_OPACITY[best.dist]})`,
      badge: best.dist > 0 ? best.dist : undefined,
      badgeColor: `var(--target-${best.ti})`,
    };
  }

  if (mode === "toIntersect") {
    if (targets.includes(id)) return {};
    if (pathUnion?.nodeSet.has(id)) {
      return { bg: `rgba(${GREEN_RGB},0.12)` };
    }
    return { dim: true };
  }

  return {};
}
