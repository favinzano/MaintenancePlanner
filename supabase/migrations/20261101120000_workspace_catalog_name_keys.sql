DO $$
BEGIN
  IF EXISTS (
    SELECT workspace_id, lower(name_en)
      FROM public.locations
     GROUP BY workspace_id, lower(name_en)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Resolve duplicate location names within each workspace before applying catalog name keys.';
  END IF;

  IF EXISTS (
    SELECT location_id, lower(name_en)
      FROM public.areas
     GROUP BY location_id, lower(name_en)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Resolve duplicate area names within each location before applying catalog name keys.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX locations_workspace_name_ci_unique
  ON public.locations (workspace_id, lower(name_en));

CREATE UNIQUE INDEX areas_location_name_ci_unique
  ON public.areas (location_id, lower(name_en));
