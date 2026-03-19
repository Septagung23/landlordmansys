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

function formatDateOnly(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function formatDateTimeIso(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return String(value);
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
        contractEnd: formatDateOnly(row.contract_end),
        coordinates: row.coordinates,
        landlordAddress: row.landlord_address ?? "",
        contact: row.contact ?? "",
        oldLeaseTime: row.old_lease_time ?? null,
        newLeaseTime: row.new_lease_time ?? null,
        negotiationComments: [],
      });
    }

    if (row.comment_id) {
      sites.get(row.site_id).negotiationComments.push({
        id: row.comment_id,
        newPricePerYear: Number(row.comment_new_price_per_year),
        growth: Number(row.comment_growth),
        note: row.comment_note,
        editedAt: formatDateTimeIso(row.comment_edited_at),
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
        s.contract_end,
        s.coordinates,
        s.landlord_address,
        s.contact,
        s.old_lease_time,
        s.new_lease_time,
        c.id as comment_id,
        c.new_price_per_year as comment_new_price_per_year,
        c.growth as comment_growth,
        c.note as comment_note,
        c.edited_at as comment_edited_at,
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

export async function getSiteByCode(siteCode) {
  const sites = await querySites("where s.code = $1", [siteCode]);
  return sites[0] ?? null;
}

export async function updateSiteLease({
  siteId,
  existingPricePerYear,
  newPricePerYear,
  landlordAddress,
  contact,
  oldLeaseTime,
  newLeaseTime,
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
            new_price_per_year = $3,
            landlord_address = $4,
            contact = $5,
            old_lease_time = $6,
            new_lease_time = $7
        where id = $1
        returning id
      `,
      [
        siteId,
        existingPricePerYear,
        newPricePerYear,
        landlordAddress,
        contact,
        oldLeaseTime,
        newLeaseTime,
      ],
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

export async function updateSiteLeaseByCode({
  siteCode,
  existingPricePerYear,
  newPricePerYear,
  landlordAddress,
  contact,
  oldLeaseTime,
  newLeaseTime,
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
            new_price_per_year = $3,
            landlord_address = $4,
            contact = $5,
            old_lease_time = $6,
            new_lease_time = $7
        where code = $1
        returning id
      `,
      [
        siteCode,
        existingPricePerYear,
        newPricePerYear,
        landlordAddress,
        contact,
        oldLeaseTime,
        newLeaseTime,
      ],
    );

    if (updateResult.rowCount === 0) {
      await client.query("rollback");
      return null;
    }

    const siteId = updateResult.rows[0].id;

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

  return getSiteByCode(siteCode);
}

export async function closePool() {
  await pool.end();
}
