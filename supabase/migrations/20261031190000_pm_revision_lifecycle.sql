ALTER TABLE public.pm_versions
  ADD COLUMN change_summary text,
  ADD COLUMN base_revision_number integer;

ALTER TABLE public.pm_versions
  DROP CONSTRAINT pm_versions_check,
  ADD CONSTRAINT pm_versions_revision_state_check CHECK (
    (status = 'draft'
      AND revision_number IS NULL
      AND approved_by IS NULL
      AND approved_at IS NULL
      AND (base_revision_number IS NULL OR base_revision_number >= 0))
    OR
    (status = 'confirmedApproved'
      AND revision_number IS NOT NULL
      AND revision_number >= 0
      AND base_revision_number IS NULL
      AND approved_by IS NOT NULL
      AND approved_at IS NOT NULL
      AND (revision_number = 0 OR (change_summary IS NOT NULL AND length(btrim(change_summary)) > 0)))
  );

DROP INDEX public.pm_versions_unique_initial_approval;
CREATE UNIQUE INDEX pm_versions_unique_approved_revision
  ON public.pm_versions (pm_id, revision_number)
  WHERE status = 'confirmedApproved';
