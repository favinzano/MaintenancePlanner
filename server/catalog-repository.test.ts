import assert from "node:assert/strict";
import test from "node:test";
import type { Pool } from "pg";
import { loadWorkspaceCatalog } from "./catalog-repository.js";

const userId = "11111111-1111-4111-8111-111111111111";
const workspaceId = "22222222-2222-4222-8222-222222222222";

test("maps only the authenticated workspace catalog for the intake form", async () => {
  let queryText = "";
  let queryValues: unknown[] = [];
  const pool = {
    async query(sql: string, values: unknown[]) {
      queryText = sql;
      queryValues = values;
      return {
        rows: [
          { id: "location-a", name_en: "Plant A", area_id: "area-a1", area_name: "Packaging" },
          { id: "location-a", name_en: "Plant A", area_id: "area-a2", area_name: "Utilities" },
          { id: "location-b", name_en: "Plant B", area_id: "area-b1", area_name: "Processing" },
        ],
      };
    },
  } as unknown as Pick<Pool, "query">;

  const catalog = await loadWorkspaceCatalog(pool, { userId, workspaceId });

  assert.deepEqual(catalog, [
    { id: "location-a", name: "Plant A", areas: [
      { id: "area-a1", name: "Packaging" }, { id: "area-a2", name: "Utilities" },
    ] },
    { id: "location-b", name: "Plant B", areas: [{ id: "area-b1", name: "Processing" }] },
  ]);
  assert.match(queryText, /WHERE u\.id = \$1 AND l\.workspace_id = \$2/);
  assert.deepEqual(queryValues, [userId, workspaceId]);
});

test("returns no intake choices when the authenticated workspace catalog is empty", async () => {
  const pool = {
    async query() { return { rows: [] }; },
  } as unknown as Pick<Pool, "query">;
  assert.deepEqual(await loadWorkspaceCatalog(pool, { userId, workspaceId }), []);
});
