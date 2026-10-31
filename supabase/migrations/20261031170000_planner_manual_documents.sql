ALTER TABLE public.sources
  ADD CONSTRAINT sources_identity_scope_unique
  UNIQUE (id, analysis_id, owner_id, workspace_id);

CREATE TABLE public.original_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  analysis_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  file_name text NOT NULL CHECK (length(file_name) BETWEEN 1 AND 255),
  content_type text NOT NULL CHECK (content_type IN (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  )),
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  sha256 char(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  content bytea NOT NULL,
  page_count integer CHECK (page_count IS NULL OR page_count > 0),
  extraction_method text NOT NULL CHECK (extraction_method IN (
    'pdf-text', 'pdf-ocr', 'docx-text', 'image-ocr'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id),
  CHECK (byte_size = octet_length(content)),
  FOREIGN KEY (source_id, analysis_id, owner_id, workspace_id)
    REFERENCES public.sources(id, analysis_id, owner_id, workspace_id) ON DELETE RESTRICT
);

CREATE INDEX original_documents_analysis_idx
  ON public.original_documents (analysis_id, owner_id, workspace_id, created_at DESC);

ALTER TABLE public.original_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.original_documents FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.original_documents TO postgres;
