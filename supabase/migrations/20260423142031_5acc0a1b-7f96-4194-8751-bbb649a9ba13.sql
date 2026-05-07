
-- Clean up any orphaned rows before adding FKs
DELETE FROM public.project_assignees pa
WHERE NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pa.project_id)
   OR NOT EXISTS (SELECT 1 FROM public.members m WHERE m.id = pa.member_id);

-- Add primary key if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_assignees_pkey'
  ) THEN
    ALTER TABLE public.project_assignees
      ADD CONSTRAINT project_assignees_pkey PRIMARY KEY (project_id, member_id);
  END IF;
END $$;

-- Add foreign keys so PostgREST can embed members(name)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_assignees_project_id_fkey'
  ) THEN
    ALTER TABLE public.project_assignees
      ADD CONSTRAINT project_assignees_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_assignees_member_id_fkey'
  ) THEN
    ALTER TABLE public.project_assignees
      ADD CONSTRAINT project_assignees_member_id_fkey
      FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
  END IF;
END $$;
