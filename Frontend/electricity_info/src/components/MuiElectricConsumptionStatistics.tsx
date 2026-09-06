import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Button,TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Stack,
} from "@mui/material";


interface ElectricityDayData {
  paiva: string;
  kokonaiskulutus: number;
  kokonaistuotanto: number;
  keskihinta: number;
  pisin_miinusjakso: number;
  eniten_kuluttava_tunti: number;
  paivan_halvimmat_tunnit: number[];
}

export default function ResponsiivinenSahkoMUI(): React.JSX.Element {
  const [data, setData] = useState<ElectricityDayData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sivu, setSivu] = useState<number>(1);
  const riviRajoitus: number = 30;
  const [alkupvm, setAlkupvm] = useState<string>("");
  const [loppupvm, setLoppupvm] = useState<string>("");
  const [vainMiinukset, setVainMiinukset] = useState<boolean>(false);
  const [jarjestys, setJarjestys] = useState<string>("uusin");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const url = `http://localhost:3001/api/electricity?page=${sivu}&limit=${riviRajoitus}&alkupvm=${alkupvm}&loppupvm=${loppupvm}&vainMiinukset=${vainMiinukset}&jarjestys=${jarjestys}`;
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sivu, alkupvm, loppupvm, vainMiinukset, jarjestys]);

  if (loading && data.length === 0) return <p>Ladataan tietoja...</p>;

  const nollaaJaAseta = (FiltteriFunktio: (val: any) => void, arvo: any) => {
    setSivu(1);
    FiltteriFunktio(arvo);
  };

  return (
    <Box sx={{ padding: "20px", fontFamily: "sans-serif" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Sähködata Päivätasolla
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 4, alignItems: "center" }}
      >
        <TextField
          slotProps={{
            inputLabel: { shrink: true },
          }}
          label="Alkaen"
          type="date"
          value={alkupvm}
          onChange={(e) => nollaaJaAseta(setAlkupvm, e.target.value)}
        />
        <TextField
          slotProps={{
            inputLabel: { shrink: true },
          }}
          label="Päättyen"
          type="date"
          value={loppupvm}
          onChange={(e) => nollaaJaAseta(setLoppupvm, e.target.value)}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Järjestys</InputLabel>
          <Select
            value={jarjestys}
            label="Järjestys"
            onChange={(e) => nollaaJaAseta(setJarjestys, e.target.value)}
          >
            <MenuItem value="uusin">Uusin päivä ensin</MenuItem>
            <MenuItem value="hinta_nouseva">Halvin keskihinta ensin</MenuItem>
            <MenuItem value="hinta_laskeva">Kallein keskihinta ensin</MenuItem>
            <MenuItem value="kulutus_suurin">Suurin kulutus ensin</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={vainMiinukset}
              onChange={(e) =>
                nollaaJaAseta(setVainMiinukset, e.target.checked)
              }
            />
          }
          label="Vain miinustunnit"
        />
      </Stack>

      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {data.map((rivi) => (
            <Card key={rivi.paiva} elevation={2}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    borderBottom: "1px solid #eee",
                    pb: 1,
                    mb: 1.5,
                    fontWeight: "bold",
                  }}
                >
                  {rivi.paiva}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">Kulutus:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {(rivi.kokonaiskulutus ?? 0).toFixed(2)} kWh
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">Tuotanto:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {(rivi.kokonaistuotanto ?? 0).toFixed(2)} kWh
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">Keskihinta:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {(rivi.keskihinta ?? 0).toFixed(2)} c/kWh
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    Pisin miinusjakso:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {rivi.pisin_miinusjakso} h
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="text.secondary">
                    Suurin kulutustunti:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    Klo {rivi.eniten_kuluttava_tunti}:00
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    mt: 1,
                    pt: 1,
                    borderTop: "1px dashed #eee",
                  }}
                >
                  <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                    Päivän halvimmat tunnit:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", color: "success.main" }}
                  >
                    {rivi.paivan_halvimmat_tunnit
                      ?.map((tunti) => `Klo ${tunti}:00`)
                      .join(", ") || "Ei tietoa"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="sähködata">
            <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Päivä</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Kulutus (kWh)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Tuotanto (kWh)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Keskihinta (c/kWh)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Pisin miinusjakso
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Suurin kulutustunti
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Halvimmat tunnit
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((rivi) => (
                <TableRow key={rivi.paiva}>
                  <TableCell>{rivi.paiva}</TableCell>
                  <TableCell align="right">
                    {(rivi.kokonaiskulutus ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {(rivi.kokonaistuotanto ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {(rivi.keskihinta ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {rivi.pisin_miinusjakso} h
                  </TableCell>
                  <TableCell align="right">
                    Klo {rivi.eniten_kuluttava_tunti}:00
                  </TableCell>
                  <TableCell>
                    {rivi.paivan_halvimmat_tunnit
                      ?.map((t) => `Klo ${t}:00`)
                      .join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box
        sx={{
          mt: 3,
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          disabled={sivu === 1 || loading}
          onClick={() => setSivu((s) => s - 1)}
        >
          Edellinen
        </Button>
        <Typography>Sivu {sivu}</Typography>
        <Button
          variant="contained"
          disabled={data.length < riviRajoitus || loading}
          onClick={() => setSivu((s) => s + 1)}
        >
          Seuraava
        </Button>
      </Box>
    </Box>
  );
}
