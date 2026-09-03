import express from "express";
import cors from "cors";


import  electricityInfoRouter from "./routes/electricityInfoRouter.ts";
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', electricityInfoRouter);

app.listen(PORT, () => {
  console.log(`Palvelin käynnissä osoitteessa http://localhost:${PORT}`);
});
