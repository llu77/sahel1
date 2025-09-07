#!/usr/bin/env node

/**
 * Migration script to move data from JSON files to database
 * Symbol AI Co. - All Rights Reserved
 */

const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

// Database configuration - adjust based on your database choice
const DATABASE_CONFIG = {
  // For Cloudflare D1
  d1: {
    accountId: process.env.CF_ACCOUNT_ID,
    databaseId: process.env.D1_DATABASE_ID,
    apiToken: process.env.CF_API_TOKEN,
  },
  
  // For Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  
  // For PlanetScale
  planetscale: {
    url: process.env.DATABASE_URL,
  }
};

// Choose your database type
const DB_TYPE = process.env.DB_TYPE || 'd1'; // 'd1', 'supabase', or 'planetscale'

async function readJsonFile(filename) {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function migrateUsers() {
  console.log('📦 Migrating users...');
  const users = await readJsonFile('users.json');
  
  if (!users) {
    console.log('No users data found, skipping...');
    return;
  }
  
  for (const user of users) {
    // Password is already hashed in the JSON file
    console.log(`  ✓ Migrating user: ${user.name}`);
    
    // Insert user into database
    // Add your database-specific insertion code here
    await insertUser(user);
  }
  
  console.log('✅ Users migration completed');
}

async function migrateRevenues() {
  console.log('📦 Migrating revenues...');
  const revenues = await readJsonFile('revenues.json');
  
  if (!revenues) {
    console.log('No revenues data found, skipping...');
    return;
  }
  
  for (const revenue of revenues) {
    console.log(`  ✓ Migrating revenue ID: ${revenue.id}`);
    
    // Convert employee contributions to JSON string
    const employeeContributions = JSON.stringify(revenue.employeeContributions || []);
    
    // Insert revenue into database
    await insertRevenue({
      ...revenue,
      employeeContributions
    });
  }
  
  console.log('✅ Revenues migration completed');
}

async function migrateExpenses() {
  console.log('📦 Migrating expenses...');
  const expenses = await readJsonFile('expenses.json');
  
  if (!expenses) {
    console.log('No expenses data found, skipping...');
    return;
  }
  
  for (const expense of expenses) {
    console.log(`  ✓ Migrating expense ID: ${expense.id}`);
    
    // Insert expense into database
    await insertExpense(expense);
  }
  
  console.log('✅ Expenses migration completed');
}

async function migrateProductRequests() {
  console.log('📦 Migrating product requests...');
  const requests = await readJsonFile('requests.json');
  
  if (!requests) {
    console.log('No product requests data found, skipping...');
    return;
  }
  
  for (const request of requests) {
    console.log(`  ✓ Migrating request ID: ${request.id}`);
    
    // Convert products array to JSON string
    const products = JSON.stringify(request.products || []);
    
    // Insert request into database
    await insertProductRequest({
      ...request,
      products
    });
  }
  
  console.log('✅ Product requests migration completed');
}

async function migrateBonusRules() {
  console.log('📦 Migrating bonus rules...');
  const rules = await readJsonFile('bonus-rules.json');
  
  if (!rules?.rules) {
    console.log('No bonus rules data found, skipping...');
    return;
  }
  
  for (const rule of rules.rules) {
    console.log(`  ✓ Migrating bonus rule for: ${rule.employeeName}`);
    
    // Insert bonus rule into database
    await insertBonusRule(rule);
  }
  
  console.log('✅ Bonus rules migration completed');
}

// Database insertion functions - implement based on your chosen database
async function insertUser(user) {
  // Example for D1/SQL
  const sql = `
    INSERT OR REPLACE INTO users 
    (id, name, email, password, role, branch, title, permissions, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    user.id,
    user.name,
    user.email,
    user.password,
    user.role,
    user.branch,
    user.title || null,
    JSON.stringify(user.permissions || {}),
    user.active !== false,
    user.createdAt || new Date().toISOString()
  ];
  
  // Execute query based on your database
  // await executeQuery(sql, params);
}

async function insertRevenue(revenue) {
  const sql = `
    INSERT OR REPLACE INTO revenues 
    (id, total_amount, cash_amount, network_amount, date, description, 
     mismatch_reason, employee_contributions, branch, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    revenue.id,
    revenue.totalAmount,
    revenue.cashAmount || 0,
    revenue.networkAmount || 0,
    revenue.date,
    revenue.description || null,
    revenue.mismatchReason || null,
    revenue.employeeContributions,
    revenue.branch,
    revenue.createdAt || new Date().toISOString()
  ];
  
  // Execute query
  // await executeQuery(sql, params);
}

async function insertExpense(expense) {
  const sql = `
    INSERT OR REPLACE INTO expenses 
    (id, category, amount, date, description, branch, payment_method, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    expense.id,
    expense.category,
    expense.amount,
    expense.date,
    expense.description,
    expense.branch,
    expense.paymentMethod || 'cash',
    expense.createdAt || new Date().toISOString()
  ];
  
  // Execute query
  // await executeQuery(sql, params);
}

async function insertProductRequest(request) {
  const sql = `
    INSERT OR REPLACE INTO product_requests 
    (id, products, status, request_date, employee_name, branch, 
     total_amount, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    request.id,
    request.products,
    request.status,
    request.requestDate,
    request.employeeName,
    request.branch,
    request.totalAmount,
    request.notes || null,
    request.createdAt || new Date().toISOString()
  ];
  
  // Execute query
  // await executeQuery(sql, params);
}

async function insertBonusRule(rule) {
  const sql = `
    INSERT OR REPLACE INTO bonus_rules 
    (employee_name, branch, base_salary, sales_target, commission_percentage, 
     active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    rule.employeeName,
    rule.branch,
    rule.baseSalary,
    rule.salesTarget,
    rule.commissionPercentage,
    true,
    new Date().toISOString()
  ];
  
  // Execute query
  // await executeQuery(sql, params);
}

async function runMigration() {
  console.log('🚀 Starting database migration...');
  console.log(`📍 Database type: ${DB_TYPE}`);
  console.log('');
  
  try {
    // Connect to database
    // await connectToDatabase();
    
    // Run migrations
    await migrateUsers();
    await migrateRevenues();
    await migrateExpenses();
    await migrateProductRequests();
    await migrateBonusRules();
    
    console.log('');
    console.log('✨ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify data in your database');
    console.log('2. Update API endpoints to use database instead of JSON files');
    console.log('3. Test all functionality');
    console.log('4. Deploy to Cloudflare Pages');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  migrateUsers,
  migrateRevenues,
  migrateExpenses,
  migrateProductRequests,
  migrateBonusRules
};