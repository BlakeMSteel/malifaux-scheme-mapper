# Malifaux Scheme Mapper

An interactive map of the Malifaux Fourth Edition "general scheme" progression
graph for the Gaining Grounds 2025 tournament pack: 21 schemes, 67
next-available links, arranged around a discovered Hamiltonian cycle.

- **Circular diagram** — the cycle forms the outer ring; every other
  next-available link is drawn as a curve off to the side (short hops bulge
  outside the ring, long hops curve through the interior), color-coded by
  reveal-condition category. Zoom and drag-to-pan.
- **Trace mode** — click a scheme to highlight its outgoing and incoming
  links and dim everything else.
- **Aim For** — mark up to 3 target schemes; with one target, see a
  hop-distance gradient back to it; with two or three, see every chain of at
  most 4 schemes that connects all of them.
- **Reference index** — searchable, filterable list of all 21 schemes with
  full text, kept in sync with the diagram selection.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and production build
```
