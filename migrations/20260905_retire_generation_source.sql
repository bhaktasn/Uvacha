-- Optional cleanup after deploying the application that no longer uses this field.
-- Back up historical classification values first if you want to retain them.
-- No CASCADE: unexpected dependent views will stop the migration for review.
ALTER TABLE public.videos DROP COLUMN IF EXISTS generation_source;
