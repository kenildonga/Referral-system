DO $$ BEGIN
  CREATE TYPE bank_holder_type AS ENUM ('user', 'agent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "holderId" uuid NOT NULL UNIQUE,
  "userType" bank_holder_type NOT NULL,
  "accountHolderName" varchar(255) NOT NULL,
  "accountNumber" varchar(50) NOT NULL,
  "ifscCode" varchar(11) NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

ALTER TABLE users DROP COLUMN IF EXISTS "accountHolderName";
ALTER TABLE users DROP COLUMN IF EXISTS "accountNumber";
ALTER TABLE users DROP COLUMN IF EXISTS "ifscCode";
ALTER TABLE users DROP COLUMN IF EXISTS "bankName";
ALTER TABLE users DROP COLUMN IF EXISTS "branchName";

ALTER TABLE agents ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" timestamp;
