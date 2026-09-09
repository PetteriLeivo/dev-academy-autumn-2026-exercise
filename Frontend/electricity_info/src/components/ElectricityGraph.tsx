import { Paper } from "@mui/material";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ElectricityDayData {
  paiva: string;
  kokonaiskulutus: number;
  kokonaistuotanto: number;
  keskihinta: number;
  pisin_miinusjakso: number;
  eniten_kuluttava_tunti: number;
  paivan_halvimmat_tunnit: number[];
}

interface ElectricityGraphProps {
  graphData: ElectricityDayData[];
  fmtPvm: (s: string) => string;
}

export default function ElectricityGraph({
  graphData,
  fmtPvm,
}: ElectricityGraphProps) {
  if (!Array.isArray(graphData) || graphData.length === 0) return null;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        height: 350,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={[...graphData].reverse()}
          margin={{ top: 10, right: -10, left: -20, bottom: 10 }}
        >
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis
            dataKey="paiva"
            tickFormatter={fmtPvm}
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis yAxisId="left" stroke="#1976d2" tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#ff7300"
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            labelFormatter={(v) => `Päivä: ${v ? fmtPvm(v.toString()) : ""}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            yAxisId="left"
            dataKey="kokonaiskulutus"
            name="Kulutus (kWh)"
            fill="#1976d2"
            maxBarSize={30}
          />
          <Bar
            yAxisId="left"
            dataKey="kokonaistuotanto"
            name="Tuotanto (kWh)"
            fill="#2e7d32"
            maxBarSize={30}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="keskihinta"
            name="Hinta (c/kWh)"
            stroke="#ff7300"
            strokeWidth={2.5}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
}