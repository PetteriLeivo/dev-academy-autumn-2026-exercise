import express from "express";
import {
  getNeededElectricitydata,
} from "./sql/getElectricitydata.ts";
const app = express();
const PORT = 3001;

app.use(express.json());

app.get("/", getNeededElectricitydata);

app.listen(PORT, () => {
  console.log(`Palvelin käynnissä osoitteessa http://localhost:${PORT}`);
});
