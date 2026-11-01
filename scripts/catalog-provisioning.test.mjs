import assert from "node:assert/strict";
import test from "node:test";
import { parseCatalogManifest, parseProvisionArgs, provisionWorkspaceCatalog, validateProvisionTarget } from "./catalog-provisioning.mjs";

const workspaceId = "00000000-0000-4000-8000-000000000001";
const catalog = {
  workspaceId,
  locations: [
    { name: "Sample Plant East", areas: ["Packaging", "Utilities"] },
    { name: "Sample Plant West", areas: ["Processing"] },
  ],
};

test("normalizes a valid catalog manifest", () => {
  assert.deepEqual(parseCatalogManifest({
    workspaceId: workspaceId.toUpperCase(),
    locations: [{ name: "  Plant East  ", areas: ["  Packaging "] }],
  }), {
    workspaceId,
    locations: [{ name: "Plant East", areas: ["Packaging"] }],
  });
});

test("rejects empty catalogs, locations without areas, blank names, and case-insensitive duplicates", () => {
  assert.throws(() => parseCatalogManifest({ workspaceId, locations: [] }), /at least one location/i);
  assert.throws(() => parseCatalogManifest({ workspaceId, locations: [{ name: "Plant", areas: [] }] }), /at least one area/i);
  assert.throws(() => parseCatalogManifest({ workspaceId, locations: [{ name: "  ", areas: ["Area"] }] }), /non-empty/i);
  assert.throws(() => parseCatalogManifest({ workspaceId, locations: [
    { name: "Plant", areas: ["Area"] }, { name: " plant ", areas: ["Other"] },
  ] }), /unique ignoring case/i);
  assert.throws(() => parseCatalogManifest({ workspaceId, locations: [
    { name: "Plant", areas: ["Area", " area "] },
  ] }), /unique within Plant/i);
});

test("requires explicit workspace and target environment confirmations", () => {
  assert.throws(() => parseProvisionArgs(["--manifest", "catalog.json"]), /Usage:/);
  const options = parseProvisionArgs([
    "--manifest", "catalog.json", "--confirm-workspace", workspaceId,
    "--environment", "development", "--dry-run",
  ]);
  assert.equal(options.environment, "development");
  assert.equal(options.confirmWorkspace, workspaceId);
  assert.equal(options.dryRun, true);
  assert.throws(() => validateProvisionTarget({
    options, configuredEnvironment: "local", databaseUrl: "postgresql://localhost/db",
  }), /must match PLANNERMC_ENVIRONMENT/i);
});

test("requires explicit flags for remote and production targets", () => {
  const remoteOptions = parseProvisionArgs([
    "--manifest", "catalog.json", "--confirm-workspace", workspaceId, "--environment", "development",
  ]);
  assert.throws(() => validateProvisionTarget({
    options: remoteOptions, configuredEnvironment: "development", databaseUrl: "postgresql://db.example.test/db",
  }), /--allow-remote/i);

  const productionOptions = parseProvisionArgs([
    "--manifest", "catalog.json", "--confirm-workspace", workspaceId, "--environment", "production", "--allow-remote",
  ]);
  assert.throws(() => validateProvisionTarget({
    options: productionOptions, configuredEnvironment: "production", databaseUrl: "postgresql://db.example.test/db",
  }), /--confirm-production/i);
  productionOptions.confirmProduction = true;
  assert.equal(validateProvisionTarget({
    options: productionOptions, configuredEnvironment: "production", databaseUrl: "postgresql://db.example.test/db",
  }).local, false);

  assert.throws(() => validateProvisionTarget({
    options: remoteOptions, configuredEnvironment: "development", databaseUrl: "https://db.example.test/db",
  }), /postgresql database url/i);
});

function fakePool({ workspaceExists = true } = {}) {
  const calls = [];
  let nextId = 1;
  let state = { locations: new Map(), areas: new Map() };
  let working = null;
  const client = {
    async query(sql, params = []) {
      calls.push({ scope: "transaction", sql, params });
      if (sql === "BEGIN") {
        working = { locations: new Map(state.locations), areas: new Map(state.areas) };
        return { rows: [] };
      }
      if (sql === "COMMIT") {
        state = working;
        working = null;
        return { rows: [] };
      }
      if (sql === "ROLLBACK") {
        working = null;
        return { rows: [] };
      }
      if (sql.startsWith("SELECT id FROM public.workspaces")) {
        return { rows: workspaceExists ? [{ id: workspaceId }] : [] };
      }
      if (sql.startsWith("INSERT INTO public.locations")) {
        const key = `${params[0]}|${params[1].toLowerCase()}`;
        const row = working.locations.get(key) ?? { id: `location-${nextId++}` };
        row.name_en = params[1];
        row.workspace_id = params[0];
        working.locations.set(key, row);
        return { rows: [{ id: row.id, name_en: row.name_en }] };
      }
      if (sql.startsWith("INSERT INTO public.areas")) {
        const key = `${params[1]}|${params[2].toLowerCase()}`;
        const row = working.areas.get(key) ?? { id: `area-${nextId++}` };
        row.name_en = params[2];
        row.workspace_id = params[0];
        row.location_id = params[1];
        working.areas.set(key, row);
        return { rows: [{ id: row.id, name_en: row.name_en }] };
      }
      return { rows: [] };
    },
    release() { calls.push({ scope: "transaction", sql: "RELEASE" }); },
  };
  const pool = {
    async connect() { return client; },
    async query(sql, params = []) {
      calls.push({ scope: "readback", sql, params });
      if (sql.startsWith("SELECT id, name_en FROM public.locations")) {
        const row = [...state.locations.values()].find((location) => location.id === params[0] && location.workspace_id === params[1]);
        return { rows: row ? [{ id: row.id, name_en: row.name_en }] : [] };
      }
      if (sql.startsWith("SELECT id, name_en FROM public.areas")) {
        const wanted = new Set(params[2]);
        return { rows: [...state.areas.values()]
          .filter((area) => area.location_id === params[0] && area.workspace_id === params[1] && wanted.has(area.name_en.toLowerCase()))
          .map((area) => ({ id: area.id, name_en: area.name_en })) };
      }
      return { rows: [] };
    },
    calls,
    snapshot: () => ({ locations: [...state.locations.values()], areas: [...state.areas.values()] }),
  };
  return pool;
}

test("rolls back dry runs and missing workspaces before catalog writes", async () => {
  const dryRunPool = fakePool();
  const dryRun = await provisionWorkspaceCatalog(dryRunPool, parseCatalogManifest(catalog), { dryRun: true });
  assert.equal(dryRun.dryRun, true);
  assert.ok(dryRunPool.calls.some((call) => call.sql === "ROLLBACK"));
  assert.equal(dryRunPool.calls.some((call) => call.sql.startsWith("INSERT INTO")), false);

  const missingPool = fakePool({ workspaceExists: false });
  await assert.rejects(provisionWorkspaceCatalog(missingPool, parseCatalogManifest(catalog)), /workspace does not exist/i);
  assert.ok(missingPool.calls.some((call) => call.sql === "ROLLBACK"));
  assert.equal(missingPool.calls.some((call) => call.sql.startsWith("INSERT INTO")), false);
});

test("provisions the requested workspace transactionally and verifies every manifest entry after commit", async () => {
  const pool = fakePool();
  const result = await provisionWorkspaceCatalog(pool, parseCatalogManifest(catalog));
  assert.deepEqual(result, { workspaceId, locationCount: 2, areaCount: 3, dryRun: false });
  assert.equal(pool.calls.filter((call) => call.sql.startsWith("INSERT INTO public.locations")).length, 2);
  assert.equal(pool.calls.filter((call) => call.sql.startsWith("INSERT INTO public.areas")).length, 3);
  assert.ok(pool.calls.some((call) => call.sql === "COMMIT"));
  assert.equal(pool.calls.filter((call) => call.scope === "readback" && call.sql.startsWith("SELECT id, name_en FROM public.locations")).length, 2);
  assert.equal(pool.calls.filter((call) => call.scope === "readback" && call.sql.startsWith("SELECT id, name_en FROM public.areas")).length, 2);
  assert.ok(pool.calls.filter((call) => call.sql.startsWith("INSERT INTO")).every((call) => /ON CONFLICT/.test(call.sql)));
  assert.ok(pool.calls.filter((call) => call.scope === "readback").every((call) => call.params.includes(workspaceId)));

  const firstSnapshot = pool.snapshot();
  const renamedCase = parseCatalogManifest({
    workspaceId,
    locations: [
      { name: "sample plant east", areas: ["packaging", "utilities"] },
      { name: "sample plant west", areas: ["processing"] },
    ],
  });
  await provisionWorkspaceCatalog(pool, renamedCase);
  const secondSnapshot = pool.snapshot();
  assert.deepEqual(secondSnapshot.locations.map((row) => row.id), firstSnapshot.locations.map((row) => row.id));
  assert.deepEqual(secondSnapshot.areas.map((row) => row.id), firstSnapshot.areas.map((row) => row.id));
  assert.equal(secondSnapshot.locations.length, firstSnapshot.locations.length);
  assert.equal(secondSnapshot.areas.length, firstSnapshot.areas.length);

  await provisionWorkspaceCatalog(pool, parseCatalogManifest({
    workspaceId,
    locations: [{ name: "Sample Plant East", areas: ["Packaging"] }],
  }));
  const afterOmittedRows = pool.snapshot();
  assert.equal(afterOmittedRows.locations.length, firstSnapshot.locations.length);
  assert.equal(afterOmittedRows.areas.length, firstSnapshot.areas.length);
});

test("reports when post-commit read-back fails without claiming rollback", async () => {
  const pool = fakePool();
  const originalQuery = pool.query;
  pool.query = async (sql, params = []) => {
    if (sql.startsWith("SELECT id, name_en FROM public.areas")) return { rows: [] };
    return originalQuery(sql, params);
  };

  await assert.rejects(
    provisionWorkspaceCatalog(pool, parseCatalogManifest(catalog)),
    /writes committed, but independent read-back verification failed/i,
  );
  assert.ok(pool.calls.some((call) => call.sql === "COMMIT"));
  assert.equal(pool.calls.some((call) => call.sql === "ROLLBACK"), false);
});

test("rolls back the entire catalog when a write fails", async () => {
  let insertCount = 0;
  const pool = fakePool();
  const originalConnect = pool.connect;
  pool.connect = async () => {
    const client = await originalConnect();
    const originalQuery = client.query;
    client.query = async (sql, params = []) => {
      if (sql.startsWith("INSERT INTO") && ++insertCount === 2) throw new Error("synthetic write failure");
      return originalQuery(sql, params);
    };
    return client;
  };
  await assert.rejects(provisionWorkspaceCatalog(pool, parseCatalogManifest(catalog)), /synthetic write failure/i);
  assert.ok(pool.calls.some((call) => call.sql === "ROLLBACK"));
  assert.equal(pool.calls.some((call) => call.scope === "readback"), false);
});
