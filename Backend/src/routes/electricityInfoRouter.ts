import pkg from 'express';
const { Router } = pkg;
import type { Request, Response } from 'express';
import pg from 'pg';
const { Pool } = pg;

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'academy',       
  password: 'academy', 
  database: 'electricity'
});

router.get("/electricity", async (req: Request, res: Response) => {
  try {
    const sivu = parseInt(req.query.page as string, 10) || 1;
    const rivimaara = parseInt(req.query.limit as string, 10) || 30;
    const offset = (sivu - 1) * rivimaara;

    const alkupvm = req.query.alkupvm as string | undefined;
    const loppupvm = req.query.loppupvm as string | undefined;
    const vainMiinukset = req.query.vainMiinukset as string | undefined;
    
    const sortBy = (req.query.sort_by as string) || "paiva";
    const sortOrder = (req.query.sort_order as string)?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const haeKaikki = req.query.all === "true";

    const conditions: string[] = [];
    const params: any[] = [];

    if (alkupvm) {
      params.push(alkupvm);
      conditions.push(`starttime::date >= $${params.length}`);
    }
    if (loppupvm) {
      params.push(loppupvm);
      conditions.push(`starttime::date <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sallitutSarakkeet: Record<string, string> = {
      paiva: 't.paiva',
      kokonaiskulutus: 't.kokonaiskulutus',
      kokonaistuotanto: 't.kokonaistuotanto',
      keskihinta: 't.keskihinta',
      pisin_miinusjakso: 'COALESCE(m.pisin_miinusjakso, 0)'
    };

    const jarjestysSarake = sallitutSarakkeet[sortBy] || 't.paiva';
    const orderBy = `ORDER BY ${jarjestysSarake} ${sortOrder}`;

    let limitClause = "";
    if (!haeKaikki) {
      params.push(rivimaara);
      const limitPlaceholder = `$${params.length}`;
      params.push(offset);
      const offsetPlaceholder = `$${params.length}`;
      limitClause = `LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;
    }

    const query = `
      WITH hintajaksot AS (
          SELECT 
              starttime::date AS paiva, starttime, hourlyprice, consumptionamount, productionamount,
              CASE WHEN hourlyprice < 0 THEN 1 ELSE 0 END AS on_negatiivinen,
              ROW_NUMBER() OVER (PARTITION BY starttime::date ORDER BY starttime) AS jono,
              ROW_NUMBER() OVER (PARTITION BY starttime::date, CASE WHEN hourlyprice < 0 THEN 1 ELSE 0 END ORDER BY starttime) AS ryhma_jono,
              ROW_NUMBER() OVER (PARTITION BY starttime::date ORDER BY (COALESCE(consumptionamount, 0) - productionamount) DESC, starttime ASC) AS rank_kulutus,
              RANK() OVER (PARTITION BY starttime::date ORDER BY hourlyprice ASC) AS rank_hinta
          FROM electricitydata
          ${whereClause}
      ),
      perus_tilastot AS (
          SELECT paiva, COALESCE(SUM(consumptionamount), 0) AS kokonaiskulutus, COALESCE(SUM(productionamount), 0) AS kokonaistuotanto, COALESCE(AVG(hourlyprice), 0) AS keskihinta
          FROM hintajaksot GROUP BY paiva
      ),
      pisimmat_negatiiviset AS (
          SELECT paiva, MAX(tunnit_putkeen) AS pisin_miinusjakso
          FROM (
              SELECT paiva, COUNT(*) AS tunnit_putkeen FROM hintajaksot WHERE on_negatiivinen = 1 GROUP BY paiva, (jono - ryhma_jono)
          ) sub GROUP BY paiva
      ),
      kulutushuiput AS ( SELECT paiva, EXTRACT(HOUR FROM starttime) AS suurin_kulutustunti FROM hintajaksot WHERE rank_kulutus = 1 ),
      halvimmat_tunnit AS (
          SELECT paiva, ARRAY_AGG(EXTRACT(HOUR FROM starttime) ORDER BY starttime) AS halvimmat_tunnit
          FROM hintajaksot WHERE rank_hinta = 1 GROUP BY paiva
      )
      SELECT 
          t.paiva::text AS "paiva",
          ROUND(t.kokonaiskulutus, 2)::float AS "kokonaiskulutus",
          ROUND(t.kokonaistuotanto, 2)::float AS "kokonaistuotanto",
          ROUND(t.keskihinta, 2)::float AS "keskihinta",
          COALESCE(m.pisin_miinusjakso, 0)::int AS "pisin_miinusjakso",
          kh.suurin_kulutustunti::int AS "eniten_kuluttava_tunti",
          ht.halvimmat_tunnit AS "paivan_halvimmat_tunnit",
          COUNT(*) OVER()::int AS "total_rows"
      FROM perus_tilastot t
      LEFT JOIN pisimmat_negatiiviset m ON t.paiva = m.paiva
      LEFT JOIN kulutushuiput kh ON t.paiva = kh.paiva
      LEFT JOIN halvimmat_tunnit ht ON t.paiva = ht.paiva
      ${vainMiinukset === 'true' ? 'WHERE COALESCE(m.pisin_miinusjakso, 0) > 0' : ''}
      ${orderBy}
      ${limitClause};
    `;

    const { rows } = await pool.query(query, params);
    
    const totalRows = rows.length > 0 ? rows[0].total_rows : 0;
    const totalPages = Math.ceil(totalRows / rivimaara);

    res.json({
      data: rows,
      pagination: {
        nykyinenSivu: sivu,
        rivejaPerSivu: rivimaara,
        yhteensaRiveja: totalRows,
        yhteensaSivuja: totalPages
      }
    });

  } catch (error) {
    console.error("Virhe sähködatakyselyssä:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
