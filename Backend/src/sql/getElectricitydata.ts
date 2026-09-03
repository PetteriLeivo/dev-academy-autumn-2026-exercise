import { db } from "./db.ts";
import type { Request, Response } from "express";

export const getNeededElectricitydata = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = `
WITH hintajaksot AS (
    SELECT 
        starttime::date AS paiva,
        starttime,
        hourlyprice,
        consumptionamount,
        productionamount,
        CASE WHEN hourlyprice < 0 THEN 1 ELSE 0 END AS on_negatiivinen,
        ROW_NUMBER() OVER (PARTITION BY starttime::date ORDER BY starttime) AS jono,
        ROW_NUMBER() OVER (PARTITION BY starttime::date, CASE WHEN hourlyprice < 0 THEN 1 ELSE 0 END ORDER BY starttime) AS ryhma_jono,
        ROW_NUMBER() OVER (PARTITION BY starttime::date ORDER BY (COALESCE(consumptionamount, 0) - productionamount) DESC) AS rank_kulutus,
        RANK() OVER (PARTITION BY starttime::date ORDER BY hourlyprice ASC) AS rank_hinta
    FROM electricitydata
),
perus_tilastot AS (
    SELECT 
        paiva,
        SUM(consumptionamount) AS kokonaiskulutus,
        SUM(productionamount) AS kokonaistuotanto,
        AVG(hourlyprice) AS keskihinta
    FROM hintajaksot
    GROUP BY paiva
),
pisimmat_negatiiviset AS (
    SELECT 
        paiva,
        MAX(tunnit_putkeen) AS pisin_miinusjakso
    FROM (
        SELECT paiva, COUNT(*) AS tunnit_putkeen
        FROM hintajaksot
        WHERE on_negatiivinen = 1
        GROUP BY paiva, (jono - ryhma_jono)
    ) sub
    GROUP BY paiva
),
kulutushuiput AS (
    SELECT paiva, EXTRACT(HOUR FROM starttime) AS suurin_kulutustunti
    FROM hintajaksot
    WHERE rank_kulutus = 1
),
halvimmat_tunnit AS (
    SELECT 
        paiva,
        ARRAY_AGG(EXTRACT(HOUR FROM starttime) ORDER BY starttime) AS halvimmat_tunnit
    FROM hintajaksot
    WHERE rank_hinta = 1
    GROUP BY paiva
)
SELECT 
    t.paiva::text AS "paiva",
    ROUND(t.kokonaiskulutus, 2)::float AS "kokonaiskulutus",
    ROUND(t.kokonaistuotanto, 2)::float AS "kokonaistuotanto",
    ROUND(t.keskihinta, 2)::float AS "keskihinta",
    COALESCE(m.pisin_miinusjakso, 0)::int AS "pisin_miinusjakso",
    kh.suurin_kulutustunti::int AS "eniten_kuluttava_tunti",
    ht.halvimmat_tunnit AS "paivan_halvimmat_tunnit"
FROM perus_tilastot t
LEFT JOIN pisimmat_negatiiviset m ON t.paiva = m.paiva
LEFT JOIN kulutushuiput kh ON t.paiva = kh.paiva
LEFT JOIN halvimmat_tunnit ht ON t.paiva = ht.paiva
ORDER BY t.paiva DESC;
`;

  try {
    const electricitydata = await db.any(query);
    res.json(electricitydata);
  } catch (error) {
    console.error("Virhe haettaessa sähkönkäyttödataa:", error);
    res.status(500).json({ error: "Sisäinen palvelinvirhe" });
  }
};
