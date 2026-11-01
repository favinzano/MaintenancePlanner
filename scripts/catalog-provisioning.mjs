export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function requireUuid(value, label) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`${label} must be a valid UUID.`);
  }
  return value.toLowerCase();
}

function normalizeName(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  const name = value.trim();
  if (/[\u0000-\u001f\u007f]/u.test(name)) {
    throw new Error(`${label} cannot contain control characters.`);
  }
  return name;
}

export function parseCatalogManifest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The catalog manifest must be a JSON object.");
  }

  const workspaceId = requireUuid(value.workspaceId, "workspaceId");
  if (!Array.isArray(value.locations) || value.locations.length === 0) {
    throw new Error("The catalog manifest must include at least one location.");
  }

  const locationNames = new Set();
  const locations = value.locations.map((location, locationIndex) => {
    const locationLabel = `locations[${locationIndex}]`;
    if (!location || typeof location !== "object" || Array.isArray(location)) {
      throw new Error(`${locationLabel} must be an object.`);
    }
    const name = normalizeName(location.name, `${locationLabel}.name`);
    const normalizedLocation = name.toLocaleLowerCase("en-US");
    if (locationNames.has(normalizedLocation)) {
      throw new Error(`Location names must be unique ignoring case: ${name}.`);
    }
    locationNames.add(normalizedLocation);

    if (!Array.isArray(location.areas) || location.areas.length === 0) {
      throw new Error(`${locationLabel} must include at least one area.`);
    }
    const areaNames = new Set();
    const areas = location.areas.map((area, areaIndex) => {
      const areaName = normalizeName(area, `${locationLabel}.areas[${areaIndex}]`);
      const normalizedArea = areaName.toLocaleLowerCase("en-US");
      if (areaNames.has(normalizedArea)) {
        throw new Error(`Area names must be unique within ${name}, ignoring case: ${areaName}.`);
      }
      areaNames.add(normalizedArea);
      return areaName;
    });
    return { name, areas };
  });

  return { workspaceId, locations };
}

export function parseProvisionArgs(argv) {
  const options = { manifestPath: null, confirmWorkspace: null, environment: null, dryRun: false, allowRemote: false, confirmProduction: false };
  const valueOptions = new Map([
    ["--manifest", "manifestPath"],
    ["--confirm-workspace", "confirmWorkspace"],
    ["--environment", "environment"],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (valueOptions.has(argument)) {
      const key = valueOptions.get(argument);
      const value = argv[index + 1];
      if (!value || value.startsWith("--") || options[key] !== null) {
        throw new Error(`${argument} requires one value and may be supplied only once.`);
      }
      options[key] = value;
      index += 1;
      continue;
    }
    if (argument === "--dry-run" && !options.dryRun) {
      options.dryRun = true;
      continue;
    }
    if (argument === "--allow-remote" && !options.allowRemote) {
      options.allowRemote = true;
      continue;
    }
    if (argument === "--confirm-production" && !options.confirmProduction) {
      options.confirmProduction = true;
      continue;
    }
    throw new Error(`Unknown or repeated option: ${argument}.`);
  }

  if (!options.manifestPath || !options.confirmWorkspace || !options.environment) {
    throw new Error("Usage: npm run catalog:provision -- --manifest <file.json> --confirm-workspace <uuid> --environment <local|development|production> [--dry-run] [--allow-remote] [--confirm-production]");
  }
  options.confirmWorkspace = requireUuid(options.confirmWorkspace, "--confirm-workspace");
  if (!["local", "development", "production"].includes(options.environment)) {
    throw new Error("--environment must be local, development, or production.");
  }
  return options;
}

export function validateProvisionTarget({ options, configuredEnvironment, databaseUrl }) {
  if (!configuredEnvironment || options.environment !== configuredEnvironment) {
    throw new Error("--environment must match PLANNERMC_ENVIRONMENT in the operator environment.");
  }
  const parsedUrl = new URL(databaseUrl);
  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error("DATABASE_URL must use a PostgreSQL database URL.");
  }
  const hostname = parsedUrl.hostname.replace(/^\[|\]$/gu, "");
  const local = LOCAL_DATABASE_HOSTS.has(hostname);
  if (!local && !options.allowRemote) {
    throw new Error("Remote PostgreSQL requires the explicit --allow-remote option.");
  }
  if (options.environment === "production" && !options.confirmProduction) {
    throw new Error("Production requires the explicit --confirm-production option.");
  }
  return { local, hostname };
}

export async function provisionWorkspaceCatalog(pool, manifest, options = {}) {
  const workspaceId = requireUuid(manifest.workspaceId, "workspaceId");
  const client = await pool.connect();
  let transactionOpen = false;
  const locationIds = [];
  let areaCount = 0;

  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const workspace = await client.query(
      "SELECT id FROM public.workspaces WHERE id = $1 FOR UPDATE",
      [workspaceId],
    );
    if (!workspace.rows[0]) throw new Error("The confirmed workspace does not exist in this PlannerMC database.");

    if (options.dryRun) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      return {
        workspaceId,
        locationCount: manifest.locations.length,
        areaCount: manifest.locations.reduce((count, location) => count + location.areas.length, 0),
        dryRun: true,
      };
    }

    for (const location of manifest.locations) {
      const locationResult = await client.query(
        `INSERT INTO public.locations (workspace_id, name_en)
         VALUES ($1, $2)
         ON CONFLICT (workspace_id, (lower(name_en)))
         DO UPDATE SET name_en = EXCLUDED.name_en, updated_at = now()
         RETURNING id, name_en`,
        [workspaceId, location.name],
      );
      const locationId = locationResult.rows[0]?.id;
      if (!locationId || locationResult.rows[0]?.name_en !== location.name) {
        throw new Error(`Location write did not return the requested name: ${location.name}.`);
      }
      locationIds.push({ id: locationId, name: location.name, areas: location.areas });

      for (const areaName of location.areas) {
        const areaResult = await client.query(
          `INSERT INTO public.areas (workspace_id, location_id, name_en)
           VALUES ($1, $2, $3)
           ON CONFLICT (location_id, (lower(name_en)))
           DO UPDATE SET name_en = EXCLUDED.name_en, updated_at = now()
           RETURNING id, name_en`,
          [workspaceId, locationId, areaName],
        );
        if (!areaResult.rows[0]?.id || areaResult.rows[0]?.name_en !== areaName) {
          throw new Error(`Area write did not return the requested name: ${location.name} / ${areaName}.`);
        }
        areaCount += 1;
      }
    }

    await client.query("COMMIT");
    transactionOpen = false;
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  try {
    for (const location of locationIds) {
      const locationReadback = await pool.query(
        "SELECT id, name_en FROM public.locations WHERE id = $1 AND workspace_id = $2",
        [location.id, workspaceId],
      );
      const savedLocation = locationReadback.rows[0];
      if (!savedLocation || savedLocation.name_en !== location.name) {
        throw new Error(`Location read-back did not match: ${location.name}.`);
      }

      const areaReadback = await pool.query(
        `SELECT id, name_en FROM public.areas
          WHERE location_id = $1 AND workspace_id = $2 AND lower(name_en) = ANY($3::text[])
          ORDER BY lower(name_en)`,
        [location.id, workspaceId, location.areas.map((name) => name.toLocaleLowerCase("en-US"))],
      );
      const savedAreas = new Map(areaReadback.rows.map((area) => [area.name_en.toLocaleLowerCase("en-US"), area]));
      if (savedAreas.size !== location.areas.length || location.areas.some((name) => savedAreas.get(name.toLocaleLowerCase("en-US"))?.name_en !== name)) {
        throw new Error(`Area read-back did not match for location ${location.name}.`);
      }
    }
  } catch (error) {
    throw new Error("Catalog writes committed, but independent read-back verification failed. Re-run the same manifest to reconcile safely.", { cause: error });
  }

  return { workspaceId, locationCount: locationIds.length, areaCount, dryRun: false };
}
