-- +goose Up
-- Where finished work can be checked: a GitHub PR or commit, a Vercel
-- deploy, a Supabase change, any other link, or "none" for work with
-- nothing to link (planning, research, a meeting).
ALTER TABLE tasks
    ADD COLUMN proof_kind TEXT,
    ADD COLUMN proof_url TEXT,
    ADD CONSTRAINT tasks_proof_kind_check
        CHECK (proof_kind IS NULL OR proof_kind IN ('github', 'vercel', 'supabase', 'other', 'none'));

-- +goose Down
ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_proof_kind_check,
    DROP COLUMN IF EXISTS proof_url,
    DROP COLUMN IF EXISTS proof_kind;
