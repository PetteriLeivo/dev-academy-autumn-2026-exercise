import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card, CardContent, Typography, Box, useMediaQuery, useTheme, Button, TextField, FormControlLabel, Switch, Stack, Chip } from "@mui/material";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ElectricityDayData { paiva: string; kokonaiskulutus: number; kokonaistuotanto: number; keskihinta: number; pisin_miinusjakso: number; eniten_kuluttava_tunti: number; paivan_halvimmat_tunnit: number[]; }

export default function ResponsiivinenSahkoMUI(): React.JSX.Element {
  const [data, setData] = useState<ElectricityDayData[]>([]);
  const [graphData, setGraphData] = useState<ElectricityDayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sivu, setSivu] = useState(1);
  const [alkupvm, setAlkupvm] = useState("");
  const [loppupvm, setLoppupvm] = useState("");
  const [vainMiinukset, setVainMiinukset] = useState(false);
  const [sortBy, setSortBy] = useState("paiva");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [naytaGraafi, setNaytaGraafi] = useState(false);
  const theme = useTheme(); const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const url = `http://localhost:3001/api/electricity?page=${sivu}&limit=30&alkupvm=${alkupvm}&loppupvm=${loppupvm}&vainMiinukset=${vainMiinukset}&sort_by=${sortBy}&sort_order=${sortOrder}`;
        const res = await fetch(url); const json = await res.json(); setData(json.data || json || []);
      } catch (e) { console.error(e); setData([]); } finally { setLoading(false); }
    }
    fetchData();
  }, [sivu, alkupvm, loppupvm, vainMiinukset, sortBy, sortOrder]);

  useEffect(() => {
    async function fetchGraphData() {
      if (!naytaGraafi) return;
      try {
        const url = `http://localhost:3001/api/electricity?all=true&alkupvm=${alkupvm}&loppupvm=${loppupvm}&vainMiinukset=${vainMiinukset}&sort_by=paiva&sort_order=desc`;
        const res = await fetch(url); const json = await res.json(); setGraphData(json.data || json || []);
      } catch (e) { console.error(e); }
    }
    fetchGraphData();
  }, [alkupvm, loppupvm, vainMiinukset, naytaGraafi]);

  const handleSortRequest = (p: string) => { setSortOrder(sortBy === p && sortOrder === "ASC" ? "DESC" : "ASC"); setSortBy(p); setSivu(1); };
  const fmtPvm = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? s : `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`; };
  const arrows = (c: string) => sortBy !== c ? <Box component="span" sx={{ opacity: 0.3, ml: 0.6, fontSize: "0.75rem", letterSpacing: "-1px" }}>▲▼</Box> : <Box component="span" sx={{ color: "primary.main", ml: 0.6, fontSize: "0.75rem", fontWeight: "bold" }}>{sortOrder === "ASC" ? "▲" : "▼"}</Box>;
  if (loading && data.length === 0) return <Box sx={{ p: 3 }}><Typography>Ladataan...</Typography></Box>;

  return (
    <Box sx={{ padding: "20px", fontFamily: "sans-serif" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>Sähködata Päivätasolla</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4, alignItems: "center" }}>
        <TextField slotProps={{ inputLabel: { shrink: true } }} label="Alkaen" type="date" value={alkupvm} onChange={(e) => { setAlkupvm(e.target.value); setSivu(1); }} />
        <TextField slotProps={{ inputLabel: { shrink: true } }} label="Päättyen" type="date" value={loppupvm} onChange={(e) => { setLoppupvm(e.target.value); setSivu(1); }} />
        <FormControlLabel control={<Switch checked={vainMiinukset} onChange={(e) => { setVainMiinukset(e.target.checked); setSivu(1); }} />} label="Vain miinustunnit" />
        <Button variant={naytaGraafi ? "contained" : "outlined"} color="secondary" onClick={() => setNaytaGraafi(!naytaGraafi)} sx={{ ml: { sm: 'auto' }, fontWeight: "bold" }}>{naytaGraafi ? "Piilota graafi" : "Näytä graafi"}</Button>
      </Stack>
      {naytaGraafi && Array.isArray(graphData) && graphData.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, height: 350, width: "100%", boxSizing: "border-box" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={[...graphData].reverse()} margin={{ top: 10, right: -10, left: -20, bottom: 10 }}>
              <CartesianGrid stroke="#f5f5f5" /><XAxis dataKey="paiva" tickFormatter={fmtPvm} tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} /><YAxis yAxisId="left" stroke="#1976d2" tick={{ fontSize: 11 }} /><YAxis yAxisId="right" orientation="right" stroke="#ff7300" tick={{ fontSize: 11 }} /><Tooltip labelFormatter={(v) => `Päivä: ${v ? fmtPvm(v.toString()) : ""}`} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="kokonaiskulutus" name="Kulutus (kWh)" fill="#1976d2" maxBarSize={30} /><Bar yAxisId="left" dataKey="kokonaistuotanto" name="Tuotanto (kWh)" fill="#2e7d32" maxBarSize={30} /><Line yAxisId="right" type="monotone" dataKey="keskihinta" name="Hinta (c/kWh)" stroke="#ff7300" strokeWidth={2.5} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Paper>
      )}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            {["paiva", "kokonaiskulutus", "kokonaistuotanto", "keskihinta", "pisin_miinusjakso"].map((col) => (
              <Chip key={col} label={`${col === "pisin_miinusjakso" ? "Miinusputki" : col === "keskihinta" ? "Hinta" : col === "kokonaistuotanto" ? "Tuotanto" : col === "kokonaiskulutus" ? "Kulutus" : "Päivä"} ${sortBy === col ? (sortOrder === "ASC" ? "▲" : "▼") : "▲▼"}`} onClick={() => handleSortRequest(col)} color={sortBy === col ? "primary" : "default"} variant={sortBy === col ? "filled" : "outlined"} />
            ))}
          </Box>
          {Array.isArray(data) && data.map((r) => (
            <Card key={r.paiva} elevation={2}><CardContent><Typography variant="h6" sx={{ borderBottom: "1px solid #eee", pb: 0.5, mb: 1, fontWeight: "bold" }}>{r.paiva}</Typography><Typography variant="body2"><b>Kulutus:</b> {(r.kokonaiskulutus ?? 0).toFixed(2)} kWh</Typography><Typography variant="body2"><b>Tuotanto:</b> {(r.kokonaistuotanto ?? 0).toFixed(2)} kWh</Typography><Typography variant="body2"><b>Keskihinta:</b> {(r.keskihinta ?? 0).toFixed(2)} c/kWh</Typography><Typography variant="body2"><b>Pisin miinus:</b> {r.pisin_miinusjakso} h</Typography><Typography variant="body2"><b>Huipputunti:</b> Klo {r.eniten_kuluttava_tunti}:00</Typography><Typography variant="body2" sx={{ color: "success.main", mt: 0.5 }}><b>Halvat tunnit:</b> {r.paivan_halvimmat_tunnit?.map(t => `Klo ${t}:00`).join(", ") || "Ei tietoa"}</Typography></CardContent></Card>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="sähködata">
            <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
              <TableRow>
                <TableCell onClick={() => handleSortRequest("paiva")} sx={{ cursor: "pointer", fontWeight: "bold", userSelect: "none" }}>Päivä {arrows("paiva")}</TableCell>
                <TableCell align="right" onClick={() => handleSortRequest("kokonaiskulutus")} sx={{ cursor: "pointer", fontWeight: "bold", userSelect: "none" }}>Kulutus {arrows("kokonaiskulutus")}</TableCell>
                <TableCell align="right" onClick={() => handleSortRequest("kokonaistuotanto")} sx={{ cursor: "pointer", fontWeight: "bold", userSelect: "none" }}>Tuotanto {arrows("kokonaistuotanto")}</TableCell>
                <TableCell align="right" onClick={() => handleSortRequest("keskihinta")} sx={{ cursor: "pointer", fontWeight: "bold", userSelect: "none" }}>Hinta {arrows("keskihinta")}</TableCell>
                <TableCell align="right" onClick={() => handleSortRequest("pisin_miinusjakso")} sx={{ cursor: "pointer", fontWeight: "bold", userSelect: "none" }}>Miinusputki {arrows("pisin_miinusjakso")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(data) && data.map((r) => (
                <TableRow key={r.paiva} hover><TableCell>{r.paiva}</TableCell><TableCell align="right">{(r.kokonaiskulutus ?? 0).toFixed(2)}</TableCell><TableCell align="right">{(r.kokonaistuotanto ?? 0).toFixed(2)}</TableCell><TableCell align="right">{(r.keskihinta ?? 0).toFixed(2)}</TableCell><TableCell align="right">{r.pisin_miinusjakso}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: "center" }}>
        <Button disabled={sivu === 1} onClick={() => setSivu((p) => Math.max(p - 1, 1))} variant="outlined">Edellinen</Button>
        <Typography sx={{ alignSelf: "center", fontWeight: "bold" }}>Sivu {sivu}</Typography>
        <Button disabled={data.length < 30} onClick={() => setSivu((p) => p + 1)} variant="outlined">Seuraava</Button>
      </Stack>
    </Box>
  );
}
