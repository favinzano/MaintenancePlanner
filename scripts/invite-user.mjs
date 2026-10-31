import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import pg from "pg";

const email = process.argv[2]?.trim();
const workspaceId = process.env.PLANNERMC_WORKSPACE_ID;
const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const databaseUrl = process.env.DATABASE_URL;
const databaseSslCaFile = process.env.DATABASE_SSL_CA_FILE;

if (!email || !workspaceId || !url || !secretKey || !databaseUrl) {
  throw new Error("Usage: npm run invite-user -- email@example.com with PLANNERMC_WORKSPACE_ID, SUPABASE_URL, SUPABASE_SECRET_KEY, and DATABASE_URL set.");
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});
const connectionUrl = new URL(databaseUrl);
const databaseHostname = connectionUrl.hostname.replace(/^\[|\]$/g, "");
const isLocalDatabase = new Set(["localhost", "127.0.0.1", "::1"]).has(databaseHostname);
if (!isLocalDatabase && !databaseSslCaFile) {
  throw new Error("DATABASE_SSL_CA_FILE is required for remote PostgreSQL connections.");
}
connectionUrl.searchParams.delete("sslmode");
const pool = new pg.Pool({
  connectionString: connectionUrl.toString(),
  ...(databaseSslCaFile
    ? { ssl: { ca: readFileSync(databaseSslCaFile, "utf8"), rejectUnauthorized: true } }
    : {}),
  max: 1,
});

try {
  const workspace = await pool.query("SELECT id FROM public.workspaces WHERE id = $1", [workspaceId]);
  if (!workspace.rowCount) throw new Error("The workspace ID does not exist in PlannerMC PostgreSQL.");

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: process.env.SUPABASE_INVITE_REDIRECT_URL,
  });
  if (error || !data.user) throw error ?? new Error("Supabase Auth did not return the invited user.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO public.users (id, workspace_id)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [data.user.id, workspaceId],
    );
    const profile = await client.query("SELECT workspace_id FROM public.users WHERE id = $1", [data.user.id]);
    if (profile.rows[0]?.workspace_id !== workspaceId) {
      throw new Error("This Auth identity already has a PlannerMC profile in a different workspace.");
    }
    await client.query(
      `INSERT INTO public.user_preferences (user_id, workspace_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [data.user.id, workspaceId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`The invite was created but PlannerMC profile provisioning failed for auth user ${data.user.id}. Re-run profile provisioning after correcting the database issue.`, { cause: error });
  } finally {
    client.release();
  }

  console.log(`Invitation sent and PlannerMC profile provisioned for ${email}.`);
} finally {
  await pool.end();
}
