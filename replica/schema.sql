-- PlannerMC proposed PostgreSQL schema.
-- Design artifact only: provider, deployment, limits and retention decisions remain open.
-- See specs/001-plannermc-mvp/plan.md Q1-Q6 and replica/architecture.md.

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  username text NOT NULL CHECK (username = lower(username)),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, workspace_id)
);
CREATE UNIQUE INDEX users_username_unique ON users (username);
CREATE INDEX users_workspace_idx ON users (workspace_id);

CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  conversation_language text NOT NULL DEFAULT 'en'
    CHECK (conversation_language IN ('en', 'es')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, workspace_id)
    REFERENCES users(id, workspace_id) ON DELETE CASCADE
);
CREATE INDEX user_preferences_workspace_idx ON user_preferences (workspace_id);

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  name_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, workspace_id)
);
CREATE INDEX locations_workspace_name_idx ON locations (workspace_id, lower(name_en));

CREATE TABLE areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  location_id uuid NOT NULL,
  name_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, location_id, workspace_id),
  FOREIGN KEY (location_id, workspace_id)
    REFERENCES locations(id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX areas_location_name_idx ON areas (location_id, lower(name_en));
CREATE INDEX areas_location_workspace_fk_idx ON areas (location_id, workspace_id);
CREATE INDEX areas_workspace_idx ON areas (workspace_id);

CREATE TABLE analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  location_id uuid NOT NULL,
  area_id uuid NOT NULL,
  processing_stage text NOT NULL DEFAULT 'intake'
    CHECK (processing_stage IN ('intake', 'awaitingReview', 'assetsReview', 'pmReview', 'complete', 'stopped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  FOREIGN KEY (owner_id, workspace_id)
    REFERENCES users(id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id, workspace_id)
    REFERENCES locations(id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (area_id, location_id, workspace_id)
    REFERENCES areas(id, location_id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX analyses_owner_updated_idx ON analyses (owner_id, workspace_id, updated_at DESC);
CREATE INDEX analyses_location_area_idx ON analyses (workspace_id, location_id, area_id);
CREATE INDEX analyses_location_workspace_fk_idx ON analyses (location_id, workspace_id);
CREATE INDEX analyses_area_location_workspace_fk_idx ON analyses (area_id, location_id, workspace_id);

CREATE TABLE original_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  byte_length bigint NOT NULL CHECK (byte_length >= 0),
  sha256_hex char(64) NOT NULL,
  content_bytes bytea NOT NULL,
  extraction_state text NOT NULL DEFAULT 'pending'
    CHECK (extraction_state IN ('pending', 'usable', 'partiallyUsable', 'unusable', 'failed')),
  extraction_metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(extraction_metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  CHECK (byte_length = octet_length(content_bytes)),
  FOREIGN KEY (analysis_id, owner_id, workspace_id)
    REFERENCES analyses(id, owner_id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX original_documents_analysis_created_idx
  ON original_documents (analysis_id, created_at);
CREATE INDEX original_documents_analysis_owner_workspace_fk_idx
  ON original_documents (analysis_id, owner_id, workspace_id);
CREATE INDEX original_documents_owner_workspace_idx
  ON original_documents (owner_id, workspace_id, created_at DESC);

CREATE FUNCTION protect_original_document_bytes() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'original documents cannot be deleted';
  END IF;
  IF NEW.analysis_id IS DISTINCT FROM OLD.analysis_id
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.workspace_id IS DISTINCT FROM OLD.workspace_id
     OR NEW.original_filename IS DISTINCT FROM OLD.original_filename
     OR NEW.mime_type IS DISTINCT FROM OLD.mime_type
     OR NEW.byte_length IS DISTINCT FROM OLD.byte_length
     OR NEW.sha256_hex IS DISTINCT FROM OLD.sha256_hex
     OR NEW.content_bytes IS DISTINCT FROM OLD.content_bytes THEN
    RAISE EXCEPTION 'original document identity and bytes are immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER original_documents_bytes_immutable
  BEFORE UPDATE OR DELETE ON original_documents
  FOR EACH ROW EXECUTE FUNCTION protect_original_document_bytes();

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('manual', 'externalReference', 'plannerData')),
  original_document_id uuid,
  url text,
  manufacturer text,
  model text,
  applicability text NOT NULL DEFAULT 'unknown'
    CHECK (applicability IN ('applicable', 'differentVariant', 'unknown', 'notApplicable')),
  original_text text,
  locator jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(locator) = 'object'),
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(limitations) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  CHECK (
    (kind = 'manual' AND original_document_id IS NOT NULL)
    OR (kind = 'externalReference' AND url IS NOT NULL)
    OR (kind = 'plannerData' AND original_text IS NOT NULL)
  ),
  FOREIGN KEY (analysis_id, owner_id, workspace_id)
    REFERENCES analyses(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (original_document_id, owner_id, workspace_id)
    REFERENCES original_documents(id, owner_id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX sources_analysis_kind_idx ON sources (analysis_id, kind, created_at);
CREATE INDEX sources_analysis_owner_workspace_fk_idx
  ON sources (analysis_id, owner_id, workspace_id);
CREATE INDEX sources_owner_workspace_idx ON sources (owner_id, workspace_id, created_at DESC);
CREATE INDEX sources_document_idx ON sources (original_document_id) WHERE original_document_id IS NOT NULL;
CREATE INDEX sources_document_owner_workspace_fk_idx
  ON sources (original_document_id, owner_id, workspace_id) WHERE original_document_id IS NOT NULL;

CREATE TABLE assets (
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
    REFERENCES analyses(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (parent_asset_id, owner_id, workspace_id)
    REFERENCES assets(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id, workspace_id)
    REFERENCES locations(id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (area_id, location_id, workspace_id)
    REFERENCES areas(id, location_id, workspace_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX assets_one_equipment_per_analysis
  ON assets (analysis_id) WHERE kind = 'equipment';
CREATE INDEX assets_analysis_idx ON assets (analysis_id, kind, created_at);
CREATE INDEX assets_parent_idx ON assets (parent_asset_id) WHERE parent_asset_id IS NOT NULL;
CREATE INDEX assets_analysis_owner_workspace_fk_idx
  ON assets (analysis_id, owner_id, workspace_id);
CREATE INDEX assets_parent_owner_workspace_fk_idx
  ON assets (parent_asset_id, owner_id, workspace_id) WHERE parent_asset_id IS NOT NULL;
CREATE INDEX assets_location_workspace_fk_idx ON assets (location_id, workspace_id);
CREATE INDEX assets_area_location_workspace_fk_idx
  ON assets (area_id, location_id, workspace_id);
CREATE INDEX assets_owner_name_location_idx
  ON assets (owner_id, location_id, lower(name_en));
CREATE INDEX assets_owner_serial_idx
  ON assets (owner_id, serial) WHERE serial IS NOT NULL AND serial <> '';
CREATE INDEX assets_workspace_idx ON assets (workspace_id);

CREATE FUNCTION enforce_asset_parent_level() RETURNS trigger
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

  SELECT kind, parent_asset_id
    INTO parent_kind, parent_parent_id
    FROM assets
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
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION enforce_asset_parent_level();

CREATE TABLE asset_change_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  proposed_content jsonb NOT NULL CHECK (jsonb_typeof(proposed_content) = 'object'),
  expected_row_version integer NOT NULL CHECK (expected_row_version > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  FOREIGN KEY (analysis_id, owner_id, workspace_id)
    REFERENCES analyses(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (asset_id, analysis_id, owner_id, workspace_id)
    REFERENCES assets(id, analysis_id, owner_id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX asset_change_proposals_asset_status_idx
  ON asset_change_proposals (asset_id, status, created_at DESC);
CREATE INDEX asset_change_proposals_analysis_owner_workspace_fk_idx
  ON asset_change_proposals (analysis_id, owner_id, workspace_id);
CREATE INDEX asset_change_proposals_owner_workspace_idx
  ON asset_change_proposals (owner_id, workspace_id, created_at DESC);

CREATE TABLE planner_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  target_kind text NOT NULL CHECK (target_kind IN ('analysis', 'asset', 'assetChangeProposal', 'pmVersion', 'pendingIssue')),
  target_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN (
    'authorizeNextStep', 'continueWithLimitation', 'provideAnswer', 'createNewAsset',
    'proposeAssetUpdate', 'acceptProposal', 'modifyProposal', 'discardProposal',
    'approvePM', 'approveSplit', 'stopAnalysis', 'keepExisting'
  )),
  presented_digest char(64) NOT NULL,
  decision_value jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(decision_value) = 'object'),
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (analysis_id, owner_id, workspace_id)
    REFERENCES analyses(id, owner_id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX planner_decisions_analysis_time_idx
  ON planner_decisions (analysis_id, decided_at DESC);
CREATE INDEX planner_decisions_target_idx
  ON planner_decisions (target_kind, target_id, decided_at DESC);
CREATE INDEX planner_decisions_owner_workspace_idx
  ON planner_decisions (owner_id, workspace_id, decided_at DESC);

CREATE TABLE pms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  current_approved_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  FOREIGN KEY (asset_id, owner_id, workspace_id)
    REFERENCES assets(id, owner_id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX pms_asset_idx ON pms (asset_id, created_at DESC);
CREATE INDEX pms_asset_owner_workspace_fk_idx ON pms (asset_id, owner_id, workspace_id);
CREATE INDEX pms_owner_workspace_idx ON pms (owner_id, workspace_id, updated_at DESC);

CREATE TABLE pm_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmedApproved')),
  revision_number integer,
  base_approved_version_id uuid,
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  frequency jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(frequency) = 'object'),
  row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, pm_id),
  UNIQUE (id, owner_id, workspace_id),
  CHECK (
    (status = 'draft' AND revision_number IS NULL AND approved_by IS NULL AND approved_at IS NULL)
    OR
    (status = 'confirmedApproved' AND revision_number IS NOT NULL AND revision_number >= 0
      AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
  ),
  FOREIGN KEY (pm_id, owner_id, workspace_id)
    REFERENCES pms(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (base_approved_version_id, pm_id)
    REFERENCES pm_versions(id, pm_id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by, workspace_id)
    REFERENCES users(id, workspace_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX pm_versions_formal_revision_unique
  ON pm_versions (pm_id, revision_number) WHERE revision_number IS NOT NULL;
CREATE INDEX pm_versions_pm_status_updated_idx
  ON pm_versions (pm_id, status, updated_at DESC);
CREATE INDEX pm_versions_pm_owner_workspace_fk_idx
  ON pm_versions (pm_id, owner_id, workspace_id);
CREATE INDEX pm_versions_owner_workspace_idx
  ON pm_versions (owner_id, workspace_id, created_at DESC);
CREATE INDEX pm_versions_base_idx
  ON pm_versions (base_approved_version_id) WHERE base_approved_version_id IS NOT NULL;
CREATE INDEX pm_versions_base_pm_fk_idx
  ON pm_versions (base_approved_version_id, pm_id)
  WHERE base_approved_version_id IS NOT NULL;
CREATE INDEX pm_versions_approver_idx
  ON pm_versions (approved_by, approved_at DESC) WHERE approved_by IS NOT NULL;
CREATE INDEX pm_versions_approver_workspace_fk_idx
  ON pm_versions (approved_by, workspace_id) WHERE approved_by IS NOT NULL;

CREATE FUNCTION protect_approved_pm_version() RETURNS trigger
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
  BEFORE UPDATE OR DELETE ON pm_versions
  FOR EACH ROW EXECUTE FUNCTION protect_approved_pm_version();

ALTER TABLE pms
  ADD CONSTRAINT pms_current_version_same_pm_fk
  FOREIGN KEY (current_approved_version_id, id)
  REFERENCES pm_versions(id, pm_id) ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX pms_current_approved_version_idx
  ON pms (current_approved_version_id) WHERE current_approved_version_id IS NOT NULL;

CREATE TABLE pending_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL,
  pm_version_id uuid,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  field_path text NOT NULL,
  reason text NOT NULL,
  remains_unresolved boolean NOT NULL DEFAULT true,
  resolution_kind text CHECK (resolution_kind IN ('providedAnswer', 'continueWithLimitation', 'resolvedByEvidence')),
  resolution_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  FOREIGN KEY (analysis_id, owner_id, workspace_id)
    REFERENCES analyses(id, owner_id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (pm_version_id, owner_id, workspace_id)
    REFERENCES pm_versions(id, owner_id, workspace_id) ON DELETE CASCADE,
  CHECK (remains_unresolved OR resolution_kind IS NOT NULL)
);
CREATE INDEX pending_issues_analysis_open_idx
  ON pending_issues (analysis_id, created_at) WHERE remains_unresolved;
CREATE INDEX pending_issues_analysis_owner_workspace_fk_idx
  ON pending_issues (analysis_id, owner_id, workspace_id);
CREATE INDEX pending_issues_version_idx
  ON pending_issues (pm_version_id, created_at) WHERE pm_version_id IS NOT NULL;
CREATE INDEX pending_issues_version_owner_workspace_fk_idx
  ON pending_issues (pm_version_id, owner_id, workspace_id) WHERE pm_version_id IS NOT NULL;
CREATE INDEX pending_issues_owner_workspace_idx
  ON pending_issues (owner_id, workspace_id, remains_unresolved);

CREATE TABLE evidence_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_version_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  field_path text NOT NULL,
  basis text NOT NULL CHECK (basis IN ('document', 'externalReference', 'plannerData', 'estimate', 'unresolved')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id, workspace_id),
  FOREIGN KEY (pm_version_id, owner_id, workspace_id)
    REFERENCES pm_versions(id, owner_id, workspace_id) ON DELETE CASCADE
);
CREATE INDEX evidence_annotations_version_field_idx
  ON evidence_annotations (pm_version_id, field_path);
CREATE INDEX evidence_annotations_version_owner_workspace_fk_idx
  ON evidence_annotations (pm_version_id, owner_id, workspace_id);
CREATE INDEX evidence_annotations_owner_workspace_idx
  ON evidence_annotations (owner_id, workspace_id, created_at DESC);

CREATE TABLE evidence_sources (
  evidence_annotation_id uuid NOT NULL,
  source_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (evidence_annotation_id, source_id),
  FOREIGN KEY (evidence_annotation_id, owner_id, workspace_id)
    REFERENCES evidence_annotations(id, owner_id, workspace_id) ON DELETE CASCADE,
  FOREIGN KEY (source_id, owner_id, workspace_id)
    REFERENCES sources(id, owner_id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX evidence_sources_source_idx ON evidence_sources (source_id);
CREATE INDEX evidence_sources_source_owner_workspace_fk_idx
  ON evidence_sources (source_id, owner_id, workspace_id);
CREATE INDEX evidence_sources_annotation_owner_workspace_fk_idx
  ON evidence_sources (evidence_annotation_id, owner_id, workspace_id);
CREATE INDEX evidence_sources_owner_workspace_idx ON evidence_sources (owner_id, workspace_id);

CREATE TABLE technical_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_version_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  collaborator_name text NOT NULL CHECK (length(btrim(collaborator_name)) > 0),
  validated_elements jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(validated_elements) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (pm_version_id, owner_id, workspace_id)
    REFERENCES pm_versions(id, owner_id, workspace_id) ON DELETE CASCADE
);
CREATE INDEX technical_validations_version_idx
  ON technical_validations (pm_version_id, created_at);
CREATE INDEX technical_validations_version_owner_workspace_fk_idx
  ON technical_validations (pm_version_id, owner_id, workspace_id);
CREATE INDEX technical_validations_owner_workspace_idx
  ON technical_validations (owner_id, workspace_id, created_at DESC);

CREATE TABLE operation_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  operation_id uuid NOT NULL,
  request_digest char(64) NOT NULL,
  result_digest char(64),
  resource_kind text NOT NULL,
  resource_id uuid,
  outcome text NOT NULL CHECK (outcome IN ('completed', 'deleted', 'resultUnverified')),
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(result_summary) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, workspace_id, operation_id),
  FOREIGN KEY (owner_id, workspace_id)
    REFERENCES users(id, workspace_id) ON DELETE RESTRICT
);
CREATE INDEX operation_receipts_resource_idx
  ON operation_receipts (resource_kind, resource_id, created_at DESC);
CREATE INDEX operation_receipts_owner_workspace_created_idx
  ON operation_receipts (owner_id, workspace_id, created_at DESC);

-- The application must update updated_at on every mutation and increment
-- row_version on edits. Domain/application checks also enforce:
-- - asset and area consistency with their analysis;
-- - the complete PM step/safety/frequency and source-provenance rules;
-- - one current approved version and valid approval transitions;
-- - target_id ownership for polymorphic planner_decisions;
-- - owner/workspace predicates on every repository query;
-- - protected-record preservation when deleting a draft;
-- - request/result digest calculation and post-commit read-back verification.
