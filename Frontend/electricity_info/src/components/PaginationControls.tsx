import { Button, Stack, Typography } from "@mui/material";

interface PaginationControlsProps {
  sivu: number;
  yhteensaSivuja: number;
  onPageChange: (newPage: number) => void;
}

export default function PaginationControls({
  sivu,
  yhteensaSivuja,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: "center" }}>
      <Button
        disabled={sivu === 1}
        onClick={() => onPageChange(Math.max(sivu - 1, 1))}
        variant="outlined"
      >
        Edellinen
      </Button>
      <Typography sx={{ alignSelf: "center", fontWeight: "bold" }}>
        Sivu {sivu} / {yhteensaSivuja}
      </Typography>
      <Button
        disabled={sivu >= yhteensaSivuja}
        onClick={() => onPageChange(sivu + 1)}
        variant="outlined"
      >
        Seuraava
      </Button>
    </Stack>
  );
}