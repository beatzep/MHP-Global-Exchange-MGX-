-- MariaDB schema for MHP Global Exchange login data.
CREATE DATABASE IF NOT EXISTS mhp_exchange
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mhp_exchange;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  watchlist TEXT NULL,
  balance DOUBLE NOT NULL DEFAULT 10000.0
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
