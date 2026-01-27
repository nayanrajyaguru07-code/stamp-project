-- Database Schema for Stamp Project

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_no VARCHAR(50),
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Plan Requests Table
CREATE TABLE IF NOT EXISTS plan_requests (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  amount VARCHAR(50), -- Stores the transaction amount (e.g., "₹80")
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Denied'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Income Stats Table
-- Used for the dashboard revenue chart
CREATE TABLE IF NOT EXISTS income_stats (
  id SERIAL PRIMARY KEY,
  month_name VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  income_amount NUMERIC(10, 2) DEFAULT 0,
  
  -- Ensures we update existing months instead of creating duplicates
  UNIQUE(month_name, year) 
);
