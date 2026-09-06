import { db } from "../sql/db.ts";
import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

export interface ElectricityDayData {
  paiva: string;
  kokonaiskulutus: number;
  kokonaistuotanto: number;
  keskihinta: number;
  pisin_miinusjakso: number;
  eniten_kuluttava_tunti: number;
  paivan_halvimmat_tunnit: number[];
}

router.get('/electricity', async (req: Request, res: Response): Promise<void> => {
    const sivu = parseInt(req.query.page as string) || 1;
    const rivimaara = parseInt(req.query.limit as string) || 30;
    const offset = (sivu - 1) * rivimaara;

    // Haetaan suodatinparametrit URL:stä (voivat olla undefined)
    const { alkupvm, loppupvm, vainMiinukset, jarjestys } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    // Lisätään päivämääräsuodattimet VAIN jos ne on lähetetty frontista
    if (alkupvm) {
        params.push(alkupvm);
        conditions.push(`starttime::date >= $${params.length}`);
    }
    if (loppupvm) {
        params.push(loppupvm);
        conditions.push(`starttime::date <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Päätetään järjestys (oletuksena uusin päivä ensin)
    let orderBy = 'ORDER BY t.paiva DESC';
    if (jarjestys === 'hinta_nouseva') orderBy = 'ORDER BY t.keskihinta ASC';
    if (jarjestys === 'hinta_laskeva') orderBy = 'ORDER BY t.keskihinta DESC';
    if (jarjestys === 'kulutus_suurin') orderBy = 'ORDER BY t.kokonaiskulutus DESC';

    // 💡 Lasketaan dynaamisesti oikeat paikkamerkit LIMIT- ja OFFSET-arvoille
    const limitPlaceholder = `$${params.length + 1}`;
    const offsetPlaceholder = `$${params.length + 2}`;

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
        ht.halvimmat_tunnit AS "paivan_halvimmat_tunnit"
    FROM perus_tilastot t
    LEFT JOIN pisimmat_negatiiviset m ON t.paiva = m.paiva
    LEFT JOIN kulutushuiput kh ON t.paiva = kh.paiva
    LEFT JOIN halvimmat_tunnit ht ON t.paiva = ht.paiva
    ${vainMiinukset === 'true' ? 'WHERE COALESCE(m.pisin_miinusjakso, 0) > 0' : ''}
    ${orderBy}
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    try {
        // Pusketaan rivimäärä ja offset AINA taulukon loppuun, olipa siellä suodattimia tai ei
        const finalParams = [...params, rivimaara, offset];
        
        const result = await db.query(query, finalParams);
        res.json(result as ElectricityDayData[]);
    } catch (err) {
        console.error("Tietokantavirhe reitissä /electricity:", err);
        res.status(500).send("Tietokantavirhe");
    }
});

export default router;
