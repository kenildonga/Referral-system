ALTER TABLE users ADD COLUMN IF NOT EXISTS "dateOfBirth" date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "addressLine1" varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "addressLine2" varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS landmark varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "postalCode" varchar(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isMarried" boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "marriageDate" date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" timestamp;

CREATE TABLE IF NOT EXISTS phone_registration_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phoneNumber" varchar(10) NOT NULL,
  "otpHash" varchar(255) NOT NULL,
  "expiresAt" timestamp NOT NULL,
  attempts int DEFAULT 0,
  "usedAt" timestamp,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
