import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to start the backend.");
}

const pool = new Pool({
  connectionString,
  ssl: getSslConfig(connectionString),
});

function getSslConfig(databaseUrl) {
  try {
    const { hostname } = new URL(databaseUrl);
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return false;
    }
  } catch {
    return { rejectUnauthorized: false };
  }

  return { rejectUnauthorized: false };
}

function mapRowsToSites(rows) {
  const sites = new Map();

  for (const row of rows) {
    if (!sites.has(row.site_id)) {
      sites.set(row.site_id, {
        id: row.site_id,
        code: row.code,
        legacyCode: row.legacy_code,
        ll: row.ll,
        negotiator: row.negotiator,
        towerType: row.tower_type,
        province: row.province,
        existingPricePerYear: Number(row.existing_price_per_year),
        newPricePerYear: Number(row.new_price_per_year),
        contractEnd: row.contract_end,
        coordinates: row.coordinates,
        negotiationComments: [],
      });
    }

    if (row.comment_id) {
      sites.get(row.site_id).negotiationComments.push({
        id: row.comment_id,
        newPricePerYear: Number(row.comment_new_price_per_year),
        growth: Number(row.comment_growth),
        note: row.comment_note,
        editedAt: row.comment_edited_at,
        editedBy: row.comment_edited_by,
      });
    }
  }

  return [...sites.values()];
}

async function querySites(whereClause = "", params = []) {
  const { rows } = await pool.query(
    `
      select
        s.id as site_id,
        s.code,
        s.legacy_code,
        s.ll,
        s.negotiator,
        s.tower_type,
        s.province,
        s.existing_price_per_year,
        s.new_price_per_year,
        to_char(s.contract_end, 'YYYY-MM-DD') as contract_end,
        s.coordinates,
        c.id as comment_id,
        c.new_price_per_year as comment_new_price_per_year,
        c.growth as comment_growth,
        c.note as comment_note,
        to_char(c.edited_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as comment_edited_at,
        c.edited_by as comment_edited_by
      from public.sites s
      left join public.site_negotiation_comments c on c.site_id = s.id
      ${whereClause}
      order by s.id asc, c.edited_at desc nulls last
    `,
    params,
  );

  return mapRowsToSites(rows);
}

export async function getAllSites() {
  return querySites();
}

export async function getSiteById(siteId) {
  const sites = await querySites("where s.id = $1", [siteId]);
  return sites[0] ?? null;
}

export async function updateSiteLease({
  siteId,
  existingPricePerYear,
  newPricePerYear,
  note,
  editedBy,
  growth,
}) {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const updateResult = await client.query(
      `
        update public.sites
        set existing_price_per_year = $2,
            new_price_per_year = $3
        where id = $1
        returning id
      `,
      [siteId, existingPricePerYear, newPricePerYear],
    );

    if (updateResult.rowCount === 0) {
      await client.query("rollback");
      return null;
    }

    await client.query(
      `
        insert into public.site_negotiation_comments (
          id,
          site_id,
          new_price_per_year,
          growth,
          note,
          edited_at,
          edited_by
        )
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        `comment-${randomUUID()}`,
        siteId,
        newPricePerYear,
        growth,
        note,
        new Date().toISOString(),
        editedBy,
      ],
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  return getSiteById(siteId);
}

export async function closePool() {
  await pool.end();
}
