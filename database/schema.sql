-- ============================================================
-- Customer Engagement & Social Sharing Microsite
-- MySQL schema (matches the Sequelize models in backend/)
-- ------------------------------------------------------------
-- Usage:  mysql -u root -p < database/schema.sql
-- Note: the backend also creates these tables automatically on
-- first run, and seeds the admin from .env. This file is for
-- reference / manual import.
-- ============================================================

CREATE DATABASE IF NOT EXISTS engagement
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE engagement;

-- Step 1: store registrations (all fields mandatory; IMEI = 15 digits)
CREATE TABLE IF NOT EXISTS customers (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  mobile           VARCHAR(255) NOT NULL,
  imei             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  city             VARCHAR(255) NOT NULL,
  sesId            VARCHAR(255) NOT NULL,
  storeLocation    VARCHAR(255) NOT NULL,
  productPurchased VARCHAR(255) NOT NULL,
  giftEligible     TINYINT(1) NOT NULL DEFAULT 1,
  giftClaimed      TINYINT(1) NOT NULL DEFAULT 0,
  createdAt        DATETIME NOT NULL,
  updatedAt        DATETIME NOT NULL,
  INDEX idx_customers_mobile (mobile)
) ENGINE=InnoDB;

-- Step 3: social proof submissions (linked to a registration; OTP-verified)
CREATE TABLE IF NOT EXISTS submissions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customerId      INT NULL,
  mobile          VARCHAR(255) NOT NULL,
  screenshotPath  VARCHAR(255) NOT NULL,
  framedImagePath VARCHAR(255),
  verified        TINYINT(1) NOT NULL DEFAULT 1,
  createdAt       DATETIME NOT NULL,
  updatedAt       DATETIME NOT NULL,
  INDEX idx_submissions_mobile (mobile),
  CONSTRAINT fk_submission_customer FOREIGN KEY (customerId)
    REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Admin users (panel access; password is bcrypt-hashed by the backend)
CREATE TABLE IF NOT EXISTS admins (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  createdAt    DATETIME NOT NULL,
  updatedAt    DATETIME NOT NULL
) ENGINE=InnoDB;

-- OTP codes (OTP verification is mandatory for submission)
CREATE TABLE IF NOT EXISTS otps (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  mobile    VARCHAR(255) NOT NULL,
  code      VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  used      TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_otps_mobile (mobile)
) ENGINE=InnoDB;
