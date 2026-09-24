import { useMemo, useState } from "react";
import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { CAT_LABEL, SCHEMES, type Category } from "../data/schemes";
import type { PathUnion } from "../lib/graph";
import type { AimMode } from "../lib/badges";
import SchemeCard from "./SchemeCard";

const CATS: Category[] = ["condition", "enemy", "turn"];

interface ReferenceIndexProps {
  selectedId: string | null;
  targets: string[];
  mode: AimMode;
  distMaps: (Record<string, number> | null)[];
  pathUnion: PathUnion | null;
  onSelect: (id: string) => void;
  onToggleAim: (id: string) => void;
}

export default function ReferenceIndex({
  selectedId,
  targets,
  mode,
  distMaps,
  pathUnion,
  onSelect,
  onToggleAim,
}: ReferenceIndexProps) {
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SCHEMES.filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q);
      const matchesCat = activeCats.size === 0 || activeCats.has(s.cat);
      return matchesQuery && matchesCat;
    });
  }, [query, activeCats]);

  function toggleCat(cat: Category) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <Box component="section" aria-label="Scheme reference index">
      <Stack
        direction="row"
        sx={{
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Reference Index
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {filtered.length} {filtered.length === 1 ? "scheme" : "schemes"}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        useFlexGap
        sx={{ flexWrap: "wrap", gap: 1.25, mb: 2.5 }}
      >
        <TextField
          size="small"
          placeholder="Search schemes by name…"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          sx={{ flex: "1 1 240px", minWidth: 0 }}
        />
        {CATS.map((cat) => {
          const active = activeCats.has(cat);
          return (
            <Chip
              key={cat}
              clickable
              onClick={() => toggleCat(cat)}
              label={CAT_LABEL[cat]}
              icon={
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    bgcolor: `var(--cat-${cat})`,
                    ml: "10px",
                  }}
                />
              }
              variant={active ? "filled" : "outlined"}
              sx={active ? { bgcolor: "grey.800", color: "#fff" } : undefined}
            />
          );
        })}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 2,
        }}
      >
        {filtered.length === 0 ? (
          <Typography
            sx={{
              gridColumn: "1 / -1",
              textAlign: "center",
              py: 5,
              color: "text.disabled",
              fontStyle: "italic",
            }}
          >
            No schemes match that search.
          </Typography>
        ) : (
          filtered.map((s) => (
            <SchemeCard
              key={s.id}
              scheme={s}
              isActive={s.id === selectedId}
              targetIndex={targets.indexOf(s.id)}
              targetsFull={targets.length >= 3}
              mode={mode}
              targets={targets}
              distMaps={distMaps}
              pathUnion={pathUnion}
              onSelect={onSelect}
              onToggleAim={onToggleAim}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
