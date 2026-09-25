import { byId, type PathUnion } from "./graph";

// "from" (origin) mode has no *Intersect variant: unlike targets — where
// picking 2-3 asks "what chain hits all of them" — multiple origins are
// alternative starting points (you only ever play from one), so they're
// always shown as independent reachability, merged by picking whichever
// origin gets there fastest.
//
// "combined" is what happens when sources and targets are active together:
// it shows which selected sources can reach ALL the selected targets (a
// shared connecting chain, like toIntersect), plus — independently — where
// those targets lead onward from there (like fromGradient, seeded by the
// targets instead of the sources).
export type AimMode =
  | "none"
  | "trace"
  | "toGradient"
  | "toIntersect"
  | "fromGradient"
  | "combined";

export interface BestMatch {
  ti: number;
  dist: number;
}

/** Which of N distance maps reaches `id` fastest (smallest hop count).
 * Generic over what the maps are seeded by — sources, or targets in either
 * direction. Written as a plain loop rather than a closure-mutated `let` —
 * TS's control-flow narrowing doesn't survive a `let` being reassigned
 * inside a nested `.forEach` callback and then read afterward. */
export function closestMatch(
  id: string,
  count: number,
  distMaps: (Record<string, number> | null)[],
): BestMatch | null {
  let best: BestMatch | null = null;
  for (let ti = 0; ti < count; ti++) {
    const d = distMaps[ti]?.[id];
    if (d !== undefined && (best === null || d < best.dist)) {
      best = { ti, dist: d };
    }
  }
  return best;
}

/** Indices of every source whose forward distance map reaches `id` within
 * the budget — i.e. every selected source that can actually get here, not
 * just the closest one. Used to color a target node by the source(s) that
 * lead to it, rather than by its own arbitrary position in the list. */
export function reachingSourceIndices(
  id: string,
  distMaps: (Record<string, number> | null)[],
): number[] {
  const out: number[] = [];
  for (let ti = 0; ti < distMaps.length; ti++) {
    if (distMaps[ti]?.[id] !== undefined) out.push(ti);
  }
  return out;
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
  targetBackwardDistMaps: (Record<string, number> | null)[],
  targetForwardDistMaps: (Record<string, number> | null)[],
): HopBadge[] {
  if (mode === "combined") {
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
    const si = sources.indexOf(id);
    if (si !== -1) {
      return [
        {
          key: "source",
          label: "selected source",
          colorVar: `var(--target-${si})`,
        },
      ];
    }
    // "On the way" covers both between source and target, and past the
    // target — pathUnion already includes chains that extend beyond a
    // target as long as the whole thing still fits the 4-scheme-from-source
    // cap (computeSourceTargetUnion draws from ALL_CHAINS, which never
    // generates chains longer than that). Anything not in pathUnion isn't
    // part of a chain that reaches EVERY selected target from a source, so
    // it's just not connected here — no fallback against a single target's
    // backward distance, which would only require reaching one of them.
    if (pathUnion?.nodeSet.has(id)) {
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
    const back = targetBackwardDistMaps[0]?.[id];
    const fwd = targetForwardDistMaps[0]?.[id];
    if (back === undefined && fwd === undefined) {
      return [{ key: "oor", label: "out of reach within 3 hops", muted: true }];
    }
    if (back === 0) {
      return [
        {
          key: "dist",
          label: "this is your target",
          colorVar: "var(--target-0)",
        },
      ];
    }
    const targetName = byId[targets[0]].name;
    const badges: HopBadge[] = [];
    if (back !== undefined) {
      badges.push({
        key: "back",
        label: `${back} ${back === 1 ? "hop" : "hops"} → ${targetName}`,
        colorVar: "var(--target-0)",
      });
    }
    if (fwd !== undefined) {
      badges.push({
        key: "fwd",
        label: `${fwd} ${fwd === 1 ? "hop" : "hops"} from ${targetName}`,
        colorVar: "var(--target-0)",
      });
    }
    return badges;
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
  /** Hop count for the source button — "start here, this many hops to the
   * target(s)" — only meaningful when a target is active. */
  sourceBadge?: number;
  sourceBadgeColor?: string;
  /** Hop count for the target button — "aim here, this many hops from the
   * source(s) / from the other target(s)" — meaningful whenever a source
   * or target is active. */
  targetBadge?: number;
  targetBadgeColor?: string;
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
  targetBackwardDistMaps: (Record<string, number> | null)[],
  targetForwardDistMaps: (Record<string, number> | null)[],
): RowState {
  if (mode === "combined") {
    if (targets.includes(id) || sources.includes(id)) return {};
    // On-chain rows (including ones past a target) are budget-checked
    // already by pathUnion — see the note in hopBadges. Everything else is
    // dimmed, full stop: no fallback tint/badge against a single target's
    // backward distance, which would only require reaching one of the
    // selected targets rather than all of them.
    if (pathUnion?.nodeSet.has(id)) {
      return { bg: `rgba(${GREEN_RGB},0.16)` };
    }
    return { dim: true };
  }

  if (mode === "toGradient") {
    const back = targetBackwardDistMaps[0]?.[id];
    const fwd = targetForwardDistMaps[0]?.[id];
    if (back === undefined && fwd === undefined) return { dim: true };
    return {
      bg:
        back !== undefined
          ? `rgba(${GREEN_RGB},${GRADIENT_ROW_OPACITY[back]})`
          : `rgba(${GREEN_RGB},0.06)`,
      sourceBadge: back && back > 0 ? back : undefined,
      sourceBadgeColor: "var(--target-0)",
      targetBadge: fwd && fwd > 0 ? fwd : undefined,
      targetBadgeColor: "var(--target-0)",
    };
  }

  if (mode === "fromGradient") {
    const best = closestMatch(id, sources.length, distMaps);
    if (!best) return { dim: true };
    return {
      bg: `rgba(${GREEN_RGB},${GRADIENT_ROW_OPACITY[best.dist]})`,
      targetBadge: best.dist > 0 ? best.dist : undefined,
      targetBadgeColor: `var(--target-${best.ti})`,
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
