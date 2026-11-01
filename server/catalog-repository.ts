import type { Pool } from "pg";
import type { CatalogLocation } from "../src/domain/planner.js";

export type CatalogOwner = { userId: string; workspaceId: string };

export async function loadWorkspaceCatalog(pool: Pick<Pool, "query">, owner: CatalogOwner): Promise<CatalogLocation[]> {
  const { rows } = await pool.query<{
    id: string;
    name_en: string;
    area_id: string;
    area_name: string;
  }>(
    `SELECT l.id, l.name_en, a.id AS area_id, a.name_en AS area_name
       FROM public.locations l
       JOIN public.areas a ON a.location_id = l.id AND a.workspace_id = l.workspace_id
       JOIN public.users u ON u.workspace_id = l.workspace_id
      WHERE u.id = $1 AND l.workspace_id = $2
      ORDER BY l.name_en, a.name_en`,
    [owner.userId, owner.workspaceId],
  );
  const locations = new Map<string, CatalogLocation>();
  for (const row of rows) {
    const location = locations.get(row.id) ?? { id: row.id, name: row.name_en, areas: [] };
    location.areas.push({ id: row.area_id, name: row.area_name });
    locations.set(row.id, location);
  }
  return [...locations.values()];
}
