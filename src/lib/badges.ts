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
