-- AI Visibility Checker - initial schema
-- Run this against the MySQL database you created in cPanel (phpMyAdmin ->
-- Import, or `mysql -u USER -p DBNAME < 001_init.sql`).
--
-- Uses the native JSON column type (MySQL 5.7.8+ / MariaDB 10.2.7+, which is
-- virtually every current cPanel host). If your server is older and the
-- CREATE TABLE statements below fail, replace every `JSON` type with
-- `LONGTEXT` - the PHP API already reads/writes JSON as plain text either
-- way, so no application code needs to change.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS leads (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  marketing_consent TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_leads_email (email),
  KEY idx_leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS businesses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500) NULL,
  domain VARCHAR(255) NULL,
  category VARCHAR(255) NOT NULL,
  city VARCHAR(255) NULL,
  service_area VARCHAR(255) NULL,
  services_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_businesses_lead_id (lead_id),
  KEY idx_businesses_domain (domain),
  CONSTRAINT fk_businesses_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audits (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id INT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  query_count INT UNSIGNED NOT NULL DEFAULT 0,
  providers_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_checks INT UNSIGNED NOT NULL DEFAULT 0,
  recommended_count INT UNSIGNED NOT NULL DEFAULT 0,
  overall_visibility_score DECIMAL(5,2) NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audits_business_id (business_id),
  KEY idx_audits_status (status),
  KEY idx_audits_created_at (created_at),
  CONSTRAINT fk_audits_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_queries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  audit_id INT UNSIGNED NOT NULL,
  query_text TEXT NOT NULL,
  query_type VARCHAR(30) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'he',
  location VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_queries_audit_id (audit_id),
  CONSTRAINT fk_queries_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_results (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  audit_id INT UNSIGNED NOT NULL,
  query_id INT UNSIGNED NOT NULL,
  provider VARCHAR(20) NOT NULL,
  model VARCHAR(100) NOT NULL,
  mentioned TINYINT(1) NULL,
  recommended TINYINT(1) NULL,
  position INT NULL,
  business_name_detected VARCHAR(255) NULL,
  raw_response LONGTEXT NULL,
  sources_json JSON NULL,
  competitors_json JSON NULL,
  error_message VARCHAR(500) NULL,
  checked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_results_audit_id (audit_id),
  KEY idx_results_query_id (query_id),
  KEY idx_results_provider (provider),
  KEY idx_results_pending (audit_id, checked_at, error_message),
  CONSTRAINT fk_results_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_query FOREIGN KEY (query_id) REFERENCES audit_queries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
