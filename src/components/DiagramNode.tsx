import type { Scheme } from "../data/schemes";
import type { NodeLayout } from "../lib/layout";
import type { NodeStyle } from "../lib/diagramVisuals";

interface DiagramNodeProps {
  scheme: Scheme;
  layout: NodeLayout;
  style: NodeStyle | undefined;
  isSelected: boolean;
  isDimmedByTrace: boolean;
  onSelect: (id: string) => void;
}

export default function DiagramNode({
  scheme,
  layout,
  style,
  isSelected,
  isDimmedByTrace,
  onSelect,
}: DiagramNodeProps) {
  function selectThisNode() {
    onSelect(scheme.id);
  }

  return (
    <g
      className={"node" + (isSelected ? " active" : "")}
      data-cat={scheme.cat}
      tabIndex={0}
      role="button"
      aria-label={scheme.name}
      onClick={selectThisNode}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectThisNode();
        }
      }}
      style={{ opacity: isDimmedByTrace ? 0.35 : undefined }}
    >
      <circle
        className="node-dot"
        cx={layout.x}
        cy={layout.y}
        r={style?.radius ?? 7}
        style={{
          fill: style?.fill,
          opacity: style?.opacity,
          stroke: style?.stroke,
          strokeWidth: style?.strokeWidth,
          strokeDasharray: style?.strokeDasharray,
        }}
      />
      <text
        className="node-label"
        x={layout.labelX}
        y={layout.labelY}
        textAnchor={layout.labelAnchor}
        transform={`rotate(${layout.labelRotation.toFixed(1)} ${layout.labelX.toFixed(1)} ${layout.labelY.toFixed(1)})`}
        style={{
          opacity: style?.opacity,
          fill: style?.labelFill ?? style?.fill,
        }}
      >
        {scheme.name}
      </text>
    </g>
  );
}
