const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const envPath = path.join(__dirname, ".env.local");
let connectionString = process.env.DATABASE_URL;

if (!connectionString && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/DATABASE_URL=(.*)/);
  if (match) {
    connectionString = match[1].trim();
    // Remove quotes if present
    if (connectionString.startsWith('"') && connectionString.endsWith('"')) {
      connectionString = connectionString.slice(1, -1);
    }
  }
}

if (!connectionString) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(
      "Tables:",
      res.rows.map((r) => r.table_name)
    );

    // Check users columns
    const userCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log(
      "Users columns:",
      userCols.rows.map((r) => r.column_name)
    );

    // Check if plan_requests table exists
    const planRequests = res.rows.find((r) => r.table_name === "plan_requests");
    if (!planRequests) {
      console.log("plan_requests table does not exist.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

checkTables();
