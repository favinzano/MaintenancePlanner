CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, workspace_id)
);
CREATE INDEX users_workspace_idx ON public.users (workspace_id);

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  conversation_language text NOT NULL DEFAULT 'en'
    CHECK (conversation_language IN ('en', 'es')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, workspace_id)
    REFERENCES public.users(id, workspace_id) ON DELETE CASCADE
);

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE RESTRICT,
  name_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, workspace_id)
);
CREATE INDEX locations_workspace_name_idx ON public.locations (workspace_id, lower(name_en));

CREATE TABLE public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  location_id uuid NOT NULL,
  name_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, location_id, workspace_id),
  FOREIGN KEY (location_id, workspace_id)
    REFERENCES public.locations(id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX areas_location_name_idx ON public.areas (location_id, lower(name_en));

CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  location_id uuid NOT NULL,
  area_id uuid NOT NULL,
  processing_stage text NOT NULL DEFAULT 'intake'
    CHECK (processing_stage IN ('intake', 'awaitingReview', 'assetsReview', 'pmReview', 'complete', 'stopped')),
  equipment_name text NOT NULL DEFAULT '',
  original_equipment_name text NOT NULL DEFAULT '',
  manufacturer text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  planner_notes text NOT NULL DEFAULT '',
  evidence_decision text NOT NULL DEFAULT 'not_decided'
    CHECK (evidence_decision IN ('not_decided', 'continue_with_limitations')),
  row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  FOREIGN KEY (owner_id, workspace_id)
    REFERENCES public.users(id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id, workspace_id)
    REFERENCES public.locations(id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (area_id, location_id, workspace_id)
    REFERENCES public.areas(id, location_id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX analyses_owner_updated_idx ON public.analyses (owner_id, workspace_id, updated_at DESC);

CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('manual', 'externalReference', 'plannerData')),
  original_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (analysis_id, owner_id, workspace_id)
    REFERENCES public.analyses(id, owner_id, workspace_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX sources_one_planner_data_per_analysis
  ON public.sources (analysis_id) WHERE kind = 'plannerData';

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  parent_asset_id uuid,
  kind text NOT NULL CHECK (kind IN ('equipment', 'subAsset')),
  location_id uuid NOT NULL,
  area_id uuid NOT NULL,
  original_name text,
  name_en text NOT NULL,
  manufacturer text,
  model text,
  serial text,
  confirmed_at timestamptz,
  row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  UNIQUE (id, analysis_id, owner_id, workspace_id),
  CHECK ((kind = 'equipment' AND parent_asset_id IS NULL) OR
         (kind = 'subAsset' AND parent_asset_id IS NOT NULL)),
  FOREIGN KEY (analysis_id, owner_id, workspace_id)
    REFERENCES public.analyses(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (parent_asset_id, owner_id, workspace_id)
    REFERENCES public.assets(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id, workspace_id)
    REFERENCES public.locations(id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (area_id, location_id, workspace_id)
    REFERENCES public.areas(id, location_id, workspace_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX assets_one_equipment_per_analysis
  ON public.assets (analysis_id) WHERE kind = 'equipment';
CREATE INDEX assets_analysis_idx ON public.assets (analysis_id, kind, created_at);

CREATE FUNCTION public.enforce_asset_parent_level() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  parent_kind text;
  parent_parent_id uuid;
BEGIN
  IF NEW.kind = 'equipment' THEN
    IF NEW.parent_asset_id IS NOT NULL THEN
      RAISE EXCEPTION 'equipment cannot have a parent asset';
    END IF;
    RETURN NEW;
  END IF;
  SELECT kind, parent_asset_id INTO parent_kind, parent_parent_id
    FROM public.assets
    WHERE id = NEW.parent_asset_id
      AND owner_id = NEW.owner_id
      AND workspace_id = NEW.workspace_id;
  IF parent_kind IS DISTINCT FROM 'equipment' OR parent_parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'subAsset parent must be the equipment root';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER assets_parent_level_guard
  BEFORE INSERT OR UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_asset_parent_level();

CREATE TABLE public.pms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  current_approved_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  FOREIGN KEY (asset_id, owner_id, workspace_id)
    REFERENCES public.assets(id, owner_id, workspace_id) ON DELETE RESTRICT
);

CREATE TABLE public.pm_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmedApproved')),
  revision_number integer,
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, pm_id),
  FOREIGN KEY (pm_id, owner_id, workspace_id)
    REFERENCES public.pms(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by, workspace_id)
    REFERENCES public.users(id, workspace_id) ON DELETE RESTRICT,
  CHECK (
    (status = 'draft' AND revision_number IS NULL AND approved_by IS NULL AND approved_at IS NULL)
    OR
    (status = 'confirmedApproved' AND revision_number = 0
      AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
  )
);
CREATE UNIQUE INDEX pm_versions_one_draft_per_pm
  ON public.pm_versions (pm_id) WHERE status = 'draft';
CREATE UNIQUE INDEX pm_versions_unique_initial_approval
  ON public.pm_versions (pm_id) WHERE status = 'confirmedApproved';

CREATE FUNCTION public.protect_approved_pm_version() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'confirmedApproved' THEN
    RAISE EXCEPTION 'confirmed PM versions are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER pm_versions_approved_immutable
  BEFORE UPDATE OR DELETE ON public.pm_versions
  FOR EACH ROW EXECUTE FUNCTION public.protect_approved_pm_version();

ALTER TABLE public.pms
  ADD CONSTRAINT pms_current_version_same_pm_fk
  FOREIGN KEY (current_approved_version_id, id)
  REFERENCES public.pm_versions(id, pm_id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE public.operation_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  operation_id uuid NOT NULL,
  request_digest char(64) NOT NULL,
  result_digest char(64),
  resource_kind text NOT NULL,
  resource_id uuid,
  outcome text NOT NULL CHECK (outcome IN ('completed', 'resultUnverified')),
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(result_summary) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, workspace_id, operation_id),
  FOREIGN KEY (owner_id, workspace_id)
    REFERENCES public.users(id, workspace_id) ON DELETE RESTRICT
);

-- PlannerMC browser clients must not query these tables through PostgREST.
-- Fastify accesses PostgreSQL with server-side credentials and applies ownership.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_receipts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.users, public.user_preferences, public.locations,
  public.areas, public.analyses, public.sources, public.assets, public.pms,
  public.pm_versions, public.operation_receipts FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users, public.user_preferences,
  public.locations, public.areas, public.analyses, public.sources, public.assets,
  public.pms, public.pm_versions, public.operation_receipts TO postgres;
