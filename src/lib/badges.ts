import { byId, type PathUnion } from "./graph";

export type AimMode = "none" | "trace" | "gradient" | "intersect";

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
  distMaps: (Record<string, number> | null)[],
  pathUnion: PathUnion | null,
): HopBadge[] {
  if (mode === "intersect") {
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

  if (mode === "gradient") {
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

  return [];
}

export interface RowState {
  /** Background tint for the collapsed row — conveys proximity/relevance
   * without adding a second line. */
  bg?: string;
  /** Dim the row's text (out of reach / not on any qualifying chain). */
  dim?: boolean;
  /** Exact hop count shown as a small badge on the target button — only
   * meaningful in single-target gradient mode. */
  badge?: number;
}

const GRADIENT_ROW_OPACITY = [0.22, 0.16, 0.1, 0.06];
const GREEN_RGB = "90,163,72";

export function schemeRowState(
  id: string,
  mode: AimMode,
  targets: string[],
  distMaps: (Record<string, number> | null)[],
  pathUnion: PathUnion | null,
): RowState {
  if (mode === "gradient") {
    const d = distMaps[0]?.[id];
    if (d === undefined) return { dim: true };
    return {
      bg: `rgba(${GREEN_RGB},${GRADIENT_ROW_OPACITY[d]})`,
      badge: d > 0 ? d : undefined,
    };
  }

  if (mode === "intersect") {
    if (targets.includes(id)) return {};
    if (pathUnion?.nodeSet.has(id)) {
      return { bg: `rgba(${GREEN_RGB},0.12)` };
    }
    return { dim: true };
  }

  return {};
}
