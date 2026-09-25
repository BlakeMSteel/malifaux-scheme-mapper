import { useMemo, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { CAT_LABEL, SCHEMES, type Category } from "../data/schemes";
import type { PathUnion } from "../lib/graph";
import type { AimMode } from "../lib/badges";
import SchemeListItem from "./SchemeListItem";

const CATS: Category[] = ["condition", "enemy", "turn"];

interface ReferenceIndexProps {
  selectedId: string | null;
  targets: string[];
  sources: string[];
  mode: AimMode;
  distMaps: (Record<string, number> | null)[];
  pathUnion: PathUnion | null;
  targetBackwardDistMaps: (Record<string, number> | null)[];
  targetForwardDistMaps: (Record<string, number> | null)[];
  onSelect: (id: string) => void;
  onToggleAim: (id: string) => void;
  onToggleSource: (id: string) => void;
}

export default function ReferenceIndex({
  selectedId,
  targets,
  sources,
  mode,
  distMaps,
  pathUnion,
  targetBackwardDistMaps,
  targetForwardDistMaps,
  onSelect,
  onToggleAim,
  onToggleSource,
}: ReferenceIndexProps) {
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return SCHEMES.filter(
      (s) => activeCats.size === 0 || activeCats.has(s.cat),
    );
  }, [activeCats]);

  function toggleCat(cat: Category) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
          mb: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Schemes
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {filtered.length} {filtered.length === 1 ? "scheme" : "schemes"}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        useFlexGap
        sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}
      >
        {CATS.map((cat) => {
          const active = activeCats.has(cat);
          return (
            <Chip
              key={cat}
              size="small"
              clickable
              onClick={() => toggleCat(cat)}
              label={CAT_LABEL[cat]}
              icon={
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: `var(--cat-${cat})`,
                    ml: "9px",
                  }}
                />
              }
              variant={active ? "filled" : "outlined"}
              sx={active ? { bgcolor: "grey.800", color: "#fff" } : undefined}
            />
          );
        })}
      </Stack>

      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
        {filtered.length === 0 ? (
          <Typography
            sx={{
              textAlign: "center",
              py: 5,
              color: "text.disabled",
              fontStyle: "italic",
            }}
          >
            No schemes match that filter.
          </Typography>
        ) : (
          filtered.map((s) => (
            <SchemeListItem
              key={s.id}
              scheme={s}
              isActive={s.id === selectedId}
              expanded={expanded.has(s.id)}
              targetIndex={targets.indexOf(s.id)}
              targetsFull={targets.length >= 3}
              sourceIndex={sources.indexOf(s.id)}
              sourcesFull={sources.length >= 3}
              mode={mode}
              targets={targets}
              sources={sources}
              distMaps={distMaps}
              pathUnion={pathUnion}
              targetBackwardDistMaps={targetBackwardDistMaps}
              targetForwardDistMaps={targetForwardDistMaps}
              onSelect={onSelect}
              onToggleExpand={toggleExpand}
              onToggleAim={onToggleAim}
              onToggleSource={onToggleSource}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
