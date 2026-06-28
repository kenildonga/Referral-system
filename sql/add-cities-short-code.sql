ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS "shortCode" VARCHAR(3);

ALTER TABLE public.cities
DROP CONSTRAINT IF EXISTS uq_cities_shortCode;

ALTER TABLE public.cities
ADD CONSTRAINT uq_cities_shortCode UNIQUE ("shortCode");
