import "dotenv/config";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { parseCatalogManifest, parseProvisionArgs, provisionWorkspaceCatalog, validateProvisionTarget } from "./catalog-provisioning.mjs";

const require = createRequire(import.meta.url);
const { Pool } = require("pg");

let pool;
try {
  const options = parseProvisionArgs(process.argv.slice(2));
  const manifest = parseCatalogManifest(JSON.parse(readFileSync(resolve(options.manifestPath), "utf8")));
  if (manifest.workspaceId !== options.confirmWorkspace) {
    throw new Error("--confirm-workspace must exactly match workspaceId in the manifest.");
  }

  const databaseConnectionString = process.env.DATABASE_URL;
  if (!databaseConnectionString) throw new Error("DATABASE_URL is required in the operator environment.");
  const databaseUrl = new URL(databaseConnectionString);
  const target = validateProvisionTarget({
    options,
    configuredEnvironment: process.env.PLANNERMC_ENVIRONMENT,
    databaseUrl: databaseConnectionString,
  });

  const caFile = process.env.DATABASE_SSL_CA_FILE;
  if (!target.local && !caFile) {
    throw new Error("DATABASE_SSL_CA_FILE is required for remote PostgreSQL connections.");
  }
  databaseUrl.searchParams.delete("sslmode");
  const ssl = caFile ? { ca: readFileSync(resolve(caFile), "utf8"), rejectUnauthorized: true } : undefined;
  pool = new Pool({ connectionString: databaseUrl.toString(), ...(ssl ? { ssl } : {}), max: 1, connectionTimeoutMillis: 5_000 });

  const result = await provisionWorkspaceCatalog(pool, manifest, { dryRun: options.dryRun });
  const action = result.dryRun ? "validated without writing" : "provisioned and independently verified";
  console.log(`Catalog ${action} for ${options.environment} workspace ${result.workspaceId}: ${result.locationCount} locations, ${result.areaCount} areas.`);
  if (!result.dryRun) console.log("Existing catalog entries omitted from the manifest were preserved.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Catalog provisioning failed.");
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}
