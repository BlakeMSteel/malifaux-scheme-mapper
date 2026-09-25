import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CAT_LABEL, SCHEMES, type Category } from "../data/schemes";
import type { AimContext } from "../lib/badges";
import SchemeListItem from "./SchemeListItem";

const CATEGORIES: Category[] = ["condition", "enemy", "turn"];

interface SectionHeaderProps {
  schemeCount: number;
  isCollapsible: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function SectionHeader({
  schemeCount,
  isCollapsible,
  isOpen,
  onToggle,
}: SectionHeaderProps) {
  return (
    <Stack
      direction="row"
      role={isCollapsible ? "button" : undefined}
      tabIndex={isCollapsible ? 0 : undefined}
      aria-expanded={isCollapsible ? isOpen : undefined}
      onClick={isCollapsible ? onToggle : undefined}
      onKeyDown={
        isCollapsible
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        mb: 1.5,
        cursor: { xs: "pointer", md: "default" },
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
        <IconButton
          size="small"
          tabIndex={-1}
          aria-hidden="true"
          sx={{
            display: { xs: "inline-flex", md: "none" },
            p: 0.5,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Schemes
        </Typography>
      </Stack>
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        {schemeCount} {schemeCount === 1 ? "scheme" : "schemes"}
      </Typography>
    </Stack>
  );
}

interface CategoryFilterChipsProps {
  activeCategories: Set<Category>;
  onToggle: (category: Category) => void;
}

function CategoryFilterChips({
  activeCategories,
  onToggle,
}: CategoryFilterChipsProps) {
  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
      {CATEGORIES.map((category) => {
        const active = activeCategories.has(category);
        return (
          <Chip
            key={category}
            size="small"
            clickable
            onClick={() => onToggle(category)}
            label={CAT_LABEL[category]}
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: `var(--cat-${category})`,
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
  );
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

interface ReferenceIndexProps {
  selectedId: string | null;
  aim: AimContext;
  onSelect: (id: string) => void;
  onToggleAim: (id: string) => void;
  onToggleSource: (id: string) => void;
}

export default function ReferenceIndex({
  selectedId,
  aim,
  onSelect,
  onToggleAim,
  onToggleSource,
}: ReferenceIndexProps) {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(
    new Set(),
  );
  const [expandedSchemeIds, setExpandedSchemeIds] = useState<Set<string>>(
    new Set(),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const contentIsVisible = !isMobile || mobileOpen;

  const filteredSchemes = useMemo(() => {
    return SCHEMES.filter(
      (scheme) =>
        activeCategories.size === 0 || activeCategories.has(scheme.cat),
    );
  }, [activeCategories]);

  function toggleCategory(category: Category) {
    setActiveCategories((prev) => toggleInSet(prev, category));
  }

  function toggleExpanded(schemeId: string) {
    setExpandedSchemeIds((prev) => toggleInSet(prev, schemeId));
  }

  return (
    <Box component="section" aria-label="Scheme reference index">
      <SectionHeader
        schemeCount={filteredSchemes.length}
        isCollapsible={isMobile}
        isOpen={mobileOpen}
        onToggle={() => setMobileOpen((open) => !open)}
      />

      <Collapse in={contentIsVisible} timeout="auto">
        <CategoryFilterChips
          activeCategories={activeCategories}
          onToggle={toggleCategory}
        />

        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
          {filteredSchemes.length === 0 ? (
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
            filteredSchemes.map((scheme) => (
              <SchemeListItem
                key={scheme.id}
                scheme={scheme}
                isActive={scheme.id === selectedId}
                expanded={expandedSchemeIds.has(scheme.id)}
                aim={aim}
                onSelect={onSelect}
                onToggleExpand={toggleExpanded}
                onToggleAim={onToggleAim}
                onToggleSource={onToggleSource}
              />
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
