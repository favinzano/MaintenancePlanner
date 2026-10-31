ALTER TABLE public.sources
  ADD COLUMN title text NOT NULL DEFAULT 'Planner-provided information',
  ADD COLUMN locator jsonb NOT NULL DEFAULT '{"kind":"plannerNotes","text":"Planner notes"}'::jsonb
    CHECK (jsonb_typeof(locator) = 'object'),
  ADD COLUMN applicability text NOT NULL DEFAULT 'unknown'
    CHECK (applicability IN ('applicable', 'different_variant', 'unknown', 'not_applicable')),
  ADD COLUMN applicability_details text NOT NULL DEFAULT '',
  ADD COLUMN limitations jsonb NOT NULL DEFAULT '["Planner-provided; not independently verified."]'::jsonb
    CHECK (jsonb_typeof(limitations) = 'array'),
  ADD COLUMN reviewed_at timestamptz;
