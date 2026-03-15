import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");
const jsonPath = path.resolve(backendDir, "../database/sites.json");

dotenv.config({ path: path.resolve(backendDir, ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to import site data.");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

function calculateGrowth(existingPricePerYear, newPricePerYear) {
  if (existingPricePerYear === 0) {
    return 0;
  }

  const value =
    ((newPricePerYear - existingPricePerYear) / existingPricePerYear) * 100;
  return Number(value.toFixed(2));
}

function normalizeSite(site) {
  if (Array.isArray(site.negotiationComments)) {
    return site;
  }

  const fallbackGrowth = calculateGrowth(
    site.existingPricePerYear,
    site.newPricePerYear,
  );
  const legacyNotes =
    typeof site.negotiationHistory === "string" ? site.negotiationHistory : "";

  return {
    ...site,
    negotiationComments: legacyNotes
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((note, index) => ({
        id: `legacy-${site.id}-${index + 1}`,
        newPricePerYear: site.newPricePerYear,
        growth: fallbackGrowth,
        note,
        editedAt: new Date(0).toISOString(),
        editedBy: "Legacy Data",
      })),
  };
}

const raw = await readFile(jsonPath, "utf8");
const sites = JSON.parse(raw).map(normalizeSite);
const client = await pool.connect();

try {
  await client.query("begin");

  for (const site of sites) {
    await client.query(
      `
        insert into public.sites (
          id,
          code,
          legacy_code,
          ll,
          negotiator,
          tower_type,
          province,
          existing_price_per_year,
          new_price_per_year,
          contract_end,
          coordinates,
          landlord_address,
          contact,
          old_lease_time,
          new_lease_time
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        on conflict (id) do update
        set code = excluded.code,
            legacy_code = excluded.legacy_code,
            ll = excluded.ll,
            negotiator = excluded.negotiator,
            tower_type = excluded.tower_type,
            province = excluded.province,
            existing_price_per_year = excluded.existing_price_per_year,
            new_price_per_year = excluded.new_price_per_year,
            contract_end = excluded.contract_end,
            coordinates = excluded.coordinates,
            landlord_address = excluded.landlord_address,
            contact = excluded.contact,
            old_lease_time = excluded.old_lease_time,
            new_lease_time = excluded.new_lease_time
      `,
      [
        site.id,
        site.code,
        site.legacyCode,
        site.ll,
        site.negotiator,
        site.towerType,
        site.province,
        site.existingPricePerYear,
        site.newPricePerYear,
        site.contractEnd,
        site.coordinates,
        site.landlordAddress ?? "",
        site.contact ?? "",
        site.oldLeaseTime ?? 0,
        site.newLeaseTime ?? 0,
      ],
    );

    await client.query(
      "delete from public.site_negotiation_comments where site_id = $1",
      [site.id],
    );

    for (const comment of site.negotiationComments ?? []) {
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
          comment.id,
          site.id,
          comment.newPricePerYear,
          comment.growth,
          comment.note,
          comment.editedAt,
          comment.editedBy,
        ],
      );
    }
  }

  await client.query("commit");
  console.log(`Imported ${sites.length} sites into Postgres.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
