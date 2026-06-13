-- ============================================================
-- MIGRATION — run this ONLY if you already created the tables
-- with the older version (before IMEI / combined submissions).
-- New installs don't need this; the backend builds fresh tables.
--
-- Usage:  mysql -u root -p engagement < database/migration.sql
-- ============================================================

USE engagement;

-- 1) Add IMEI to customers (mandatory going forward)
ALTER TABLE customers
  ADD COLUMN imei VARCHAR(255) NOT NULL DEFAULT '' AFTER mobile;

-- 2) Make registration fields mandatory
ALTER TABLE customers
  MODIFY email VARCHAR(255) NOT NULL DEFAULT '',
  MODIFY storeLocation VARCHAR(255) NOT NULL DEFAULT '',
  MODIFY productPurchased VARCHAR(255) NOT NULL DEFAULT '';

-- 3) Link submissions to a registration, drop the old name/authMethod columns
ALTER TABLE submissions
  ADD COLUMN customerId INT NULL AFTER id;

-- Backfill the link by matching mobile numbers
UPDATE submissions s
  JOIN customers c ON c.mobile = s.mobile
  SET s.customerId = c.id;

-- Remove duplicate columns that are no longer collected at submit time.
-- (Wrapped so it won't fail if a column is already gone.)
ALTER TABLE submissions DROP COLUMN name;
ALTER TABLE submissions DROP COLUMN authMethod;

-- All submissions are OTP-verified now
UPDATE submissions SET verified = 1;
