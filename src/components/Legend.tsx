import { CAT_LABEL, SCHEMES, type Category } from "../data/schemes";

const CATS: Category[] = ["condition", "enemy", "turn"];

export default function Legend() {
  return (
    <div className="legend">
      {CATS.map((cat) => (
        <span className="legend-item" key={cat}>
          <span
            className="legend-swatch"
            style={{ background: `var(--cat-${cat})` }}
          />
          {CAT_LABEL[cat]}{" "}
          <span className="legend-count">
            ({SCHEMES.filter((s) => s.cat === cat).length})
          </span>
        </span>
      ))}
    </div>
  );
}
