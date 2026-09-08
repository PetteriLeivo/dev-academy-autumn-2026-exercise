import express from "express";
import cors from "cors";
import path from "path";

const frontendDistPath = path.join(import.meta.dirname, '../../Frontend/electricity_info/dist');

import electricityInfoRouter from "./routes/electricityInfoRouter.ts";
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use(express.static(frontendDistPath));
app.use('/api', electricityInfoRouter);

app.get("*splat", (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Palvelin käynnissä osoitteessa http://localhost:${PORT}`);
});
