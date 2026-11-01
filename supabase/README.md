# Supabase development

The committed Supabase project is for local development. Its seed workspace and catalog are synthetic and must not be copied into production.

## Start locally

1. Install Docker Desktop and the Supabase CLI.
2. Run `npx supabase start` from the repository root. The CLI prints local API keys; copy the publishable key and secret key into the untracked `.env` file.
3. Copy `.env.example` to `.env` and replace the two local key placeholders with the values printed by the CLI. Keep the secret key and `DATABASE_URL` server-only.
4. Run `npx supabase db reset` to apply migrations and load the synthetic development workspace/catalog.
5. Run `npm run dev`.
6. Invite a development user from an authorized terminal with `npm run invite-user -- planner@example.com`. Open the local mail capture service at `http://127.0.0.1:54324` to retrieve the invitation link.

The app requires an invited Auth user plus a matching PlannerMC profile. Public account creation is disabled. The invite script needs the secret key and database URL from `.env`, and must only run for a workspace the operator is authorized to provision.

## Provision a workspace catalog

Locations and areas are preconfigured by an authorized operator; PlannerMC has no catalog administration screen. The operator command reads an approved JSON manifest and writes only to the workspace named in that manifest. It uses the server-only `DATABASE_URL`, requires a matching `--confirm-workspace` value, and requires `--environment` to match `PLANNERMC_ENVIRONMENT` in the operator environment.

1. Apply the current migrations to the target database. The catalog name-key migration adds case-insensitive unique indexes and stops if it finds duplicate names that need review.
2. Prepare a manifest from the authorized workspace catalog. Use `supabase/catalog-manifest.local.example.json` only as a synthetic local example; do not copy its Sample Plant values into a real workspace.
3. Set `PLANNERMC_ENVIRONMENT` in `.env` to `local`, `development`, or `production`. Review the target database URL and workspace ID without printing credentials.
4. Run a dry run first. For the committed local example:

   ```powershell
   npm run catalog:provision -- --manifest ./supabase/catalog-manifest.local.example.json --confirm-workspace 00000000-0000-4000-8000-000000000001 --environment local --dry-run
   ```

5. After reviewing the manifest and dry-run output, run the same command without `--dry-run`.

The command validates the manifest before connecting, checks that the workspace exists, applies all rows in one transaction, and performs an independent read-back before reporting success. Re-running the same manifest preserves IDs and does not create duplicate locations or areas. Names match case-insensitively within a workspace or location. Entries omitted from a manifest are preserved; this command does not delete or deactivate catalog records. Remote PostgreSQL requires a verified CA file and `--allow-remote`. Production additionally requires `--confirm-production`. These explicit flags are safeguards; they do not authorize using a production database. No production catalog values or project are included in this repository.

The authenticated `/api/workspace` response already loads locations and areas from the signed-in user's workspace. The analysis API validates that a selected area belongs to its selected location and workspace. Reload the application after provisioning to display the updated catalog.

## Connecting to a hosted Supabase project

For remote PostgreSQL connections, set `DATABASE_URL` to the project's pooler connection string and set `DATABASE_SSL_CA_FILE` to the path of the root certificate downloaded from **Project Dashboard → Database → SSL Configuration**. Keep the CA file out of version control. The Fastify API verifies the server certificate and hostname, and refuses remote connections if the CA path is missing or invalid. Do not use `sslmode=require` as a substitute for certificate verification.

Local Supabase connections use the local `DATABASE_URL` from `.env.example` and do not need a CA file. The current development project is `plannermc-dev` in `us-east-1`; its public URL and keys are in the ignored `.env` file. No production URL or credentials are stored in the repository.

The hosted schema and synthetic development catalog were applied to this isolated development project. A CA-verified API smoke check passed on 2026-10-31 for email/password sign-in, authenticated workspace reads, analysis and asset persistence with read-back, idempotency, cross-account isolation, and stale-version rejection. Its temporary users and rows were removed. The project has no SMTP provider configured, so invitation email delivery has not been tested.

## Production boundary

Create and configure a separate Supabase project before production use. Set up email delivery and redirect URLs, provision the real workspace/catalog, select the plan and backup retention, set the maximum manual size, and complete a restore exercise before enabling uploads. The repository does not contain a production URL, key, SMTP credential, or user invitation.
