ALTER TABLE admins ADD COLUMN IF NOT EXISTS "phoneNumber" varchar(10);

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM admins
  WHERE "phoneNumber" IS NULL
)
UPDATE admins AS a
SET "phoneNumber" = (9000000000 + n.rn)::text
FROM numbered AS n
WHERE a.id = n.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admins_phoneNumber_key'
  ) THEN
    ALTER TABLE admins ADD CONSTRAINT admins_phoneNumber_key UNIQUE ("phoneNumber");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'phone_registration_otps_purpose_enum'
  ) THEN
    CREATE TYPE phone_registration_otps_purpose_enum AS ENUM ('registration', 'password_reset');
  END IF;
END $$;

ALTER TABLE phone_registration_otps
  ADD COLUMN IF NOT EXISTS purpose phone_registration_otps_purpose_enum NOT NULL DEFAULT 'registration';

DROP TABLE IF EXISTS password_reset_otps;