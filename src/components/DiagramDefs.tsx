const ARROW_KINDS = ["ring", "condition", "enemy", "turn"] as const;

function arrowheadFill(kind: (typeof ARROW_KINDS)[number]): string {
  return kind === "ring" ? "var(--ink-muted)" : `var(--cat-${kind})`;
}

function SplitTargetGradient({
  targetId,
  colors,
}: {
  targetId: string;
  colors: string[];
}) {
  const bandCount = colors.length;
  return (
    <linearGradient id={`target-split-${targetId}`} x1="0" y1="0" x2="1" y2="0">
      {colors.flatMap((color, index) => [
        <stop
          key={`${index}-start`}
          offset={`${(index / bandCount) * 100}%`}
          stopColor={color}
        />,
        <stop
          key={`${index}-end`}
          offset={`${((index + 1) / bandCount) * 100}%`}
          stopColor={color}
        />,
      ])}
    </linearGradient>
  );
}

interface DiagramDefsProps {
  targets: string[];
  targetReach: Record<string, number[]>;
}

export default function DiagramDefs({
  targets,
  targetReach,
}: DiagramDefsProps) {
  const splitTargets = targets.filter(
    (targetId) => (targetReach[targetId]?.length ?? 0) >= 2,
  );

  return (
    <defs>
      {ARROW_KINDS.map((kind) => (
        <marker
          key={kind}
          id={`arrow-${kind}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth={kind === "ring" ? 7 : 6}
          markerHeight={kind === "ring" ? 7 : 6}
          orient="auto-start-reverse"
        >
          <path
            d="M0,0 L10,5 L0,10 z"
            fill={arrowheadFill(kind)}
            opacity={kind === "ring" ? 0.8 : 0.55}
          />
        </marker>
      ))}
      {splitTargets.map((targetId) => (
        <SplitTargetGradient
          key={targetId}
          targetId={targetId}
          colors={targetReach[targetId].map(
            (sourceIndex) => `var(--target-${sourceIndex})`,
          )}
        />
      ))}
    </defs>
  );
}
