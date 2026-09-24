import { Box, Stack, Typography } from "@mui/material";
import { CAT_LABEL, SCHEMES, type Category } from "../data/schemes";

const CATS: Category[] = ["condition", "enemy", "turn"];

export default function Legend() {
  return (
    <Stack
      direction="row"
      useFlexGap
      sx={{
        flexWrap: "wrap",
        columnGap: 3,
        rowGap: 1,
        pt: 1.5,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      {CATS.map((cat) => (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center" }}
          key={cat}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "3px",
              bgcolor: `var(--cat-${cat})`,
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {CAT_LABEL[cat]}{" "}
            <Typography
              component="span"
              variant="caption"
              sx={{ color: "text.disabled" }}
            >
              ({SCHEMES.filter((s) => s.cat === cat).length})
            </Typography>
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
