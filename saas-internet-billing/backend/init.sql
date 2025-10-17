CREATE DATABASE wifi_billing;

\c wifi_billing;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(200),
  tenant_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);
