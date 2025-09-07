// Cloudflare Pages Functions - API Handler
export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Database connection
    const db = env.DB || env.sahl_database;
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route handling
    if (path.startsWith('/api/auth/login')) {
      return handleLogin(request, db, corsHeaders);
    } else if (path.startsWith('/api/users')) {
      return handleUsers(request, db, corsHeaders);
    } else if (path.startsWith('/api/revenues')) {
      return handleRevenues(request, db, corsHeaders);
    } else if (path.startsWith('/api/expenses')) {
      return handleExpenses(request, db, corsHeaders);
    } else if (path.startsWith('/api/daily-closings')) {
      return handleDailyClosings(request, db, corsHeaders);
    } else if (path.startsWith('/api/requests')) {
      return handleRequests(request, db, corsHeaders);
    } else if (path.startsWith('/api/product-requests')) {
      return handleProductRequests(request, db, corsHeaders);
    } else if (path.startsWith('/api/bonus')) {
      return handleBonus(request, db, corsHeaders);
    } else {
      return new Response(JSON.stringify({ error: 'Route not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Login handler
async function handleLogin(request, db, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { email, password } = await request.json();
  
  const result = await db.prepare(
    'SELECT * FROM users WHERE email = ? AND isActive = 1'
  ).bind(email).first();

  if (!result) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Note: In production, use proper password hashing verification
  // For now, we're using the hashed passwords directly
  const bcrypt = await import('bcryptjs');
  const isValid = await bcrypt.compare(password, result.password);
  
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Generate JWT token
  const jwt = await import('jsonwebtoken');
  const token = jwt.sign(
    {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      branch: result.branch,
      permissions: JSON.parse(result.permissions || '{}')
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  // Remove password from response
  delete result.password;

  return new Response(JSON.stringify({ user: result, token }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Users handler
async function handleUsers(request, db, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  switch (request.method) {
    case 'GET':
      if (id && id !== 'users') {
        const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
        if (user) delete user.password;
        return new Response(JSON.stringify(user), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        const users = await db.prepare('SELECT * FROM users').all();
        users.results.forEach(u => delete u.password);
        return new Response(JSON.stringify(users.results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    
    case 'POST':
      const data = await request.json();
      const bcrypt = await import('bcryptjs');
      data.password = await bcrypt.hash(data.password, 10);
      data.permissions = JSON.stringify(data.permissions || {});
      
      const result = await db.prepare(
        `INSERT INTO users (name, email, password, role, branch, permissions, title, phone, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        data.name, data.email, data.password, data.role, data.branch,
        data.permissions, data.title, data.phone, data.isActive ? 1 : 0
      ).run();
      
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// Revenues handler
async function handleRevenues(request, db, corsHeaders) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const branch = url.searchParams.get('branch');

  switch (request.method) {
    case 'GET':
      let query = 'SELECT * FROM revenues WHERE 1=1';
      const params = [];
      
      if (date) {
        query += ' AND date = ?';
        params.push(date);
      }
      if (branch) {
        query += ' AND branch = ?';
        params.push(branch);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const revenues = params.length > 0
        ? await db.prepare(query).bind(...params).all()
        : await db.prepare(query).all();
      
      return new Response(JSON.stringify(revenues.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    case 'POST':
      const data = await request.json();
      const result = await db.prepare(
        `INSERT INTO revenues (documentNumber, documentType, amount, discount, totalAfterDiscount, 
         percentage, date, paymentMethod, branchRevenue, departmentRevenue, notes, branch) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        data.documentNumber, data.documentType, data.amount, data.discount || 0,
        data.totalAfterDiscount, data.percentage, data.date, data.paymentMethod,
        data.branchRevenue, data.departmentRevenue, data.notes, data.branch
      ).run();
      
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// Expenses handler
async function handleExpenses(request, db, corsHeaders) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const branch = url.searchParams.get('branch');

  switch (request.method) {
    case 'GET':
      let query = 'SELECT * FROM expenses WHERE 1=1';
      const params = [];
      
      if (date) {
        query += ' AND date = ?';
        params.push(date);
      }
      if (branch) {
        query += ' AND branch = ?';
        params.push(branch);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const expenses = params.length > 0
        ? await db.prepare(query).bind(...params).all()
        : await db.prepare(query).all();
      
      return new Response(JSON.stringify(expenses.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    case 'POST':
      const data = await request.json();
      const result = await db.prepare(
        `INSERT INTO expenses (receiptNumber, type, amount, date, paymentMethod, branch, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        data.receiptNumber, data.type, data.amount, data.date,
        data.paymentMethod, data.branch, data.description
      ).run();
      
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// Daily Closings handler
async function handleDailyClosings(request, db, corsHeaders) {
  switch (request.method) {
    case 'GET':
      const closings = await db.prepare(
        'SELECT * FROM daily_closings ORDER BY date DESC LIMIT 30'
      ).all();
      
      return new Response(JSON.stringify(closings.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    case 'POST':
      const data = await request.json();
      const result = await db.prepare(
        `INSERT INTO daily_closings (date, branch, actualCash, actualBank, systemCash, 
         systemBank, difference, status, notes, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        data.date, data.branch, data.actualCash, data.actualBank,
        data.systemCash, data.systemBank, data.difference,
        data.status, data.notes, data.createdBy
      ).run();
      
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// Requests handler
async function handleRequests(request, db, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  switch (request.method) {
    case 'GET':
      const requests = await db.prepare(
        'SELECT * FROM requests ORDER BY created_at DESC'
      ).all();
      
      return new Response(JSON.stringify(requests.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    case 'POST':
      const data = await request.json();
      const result = await db.prepare(
        `INSERT INTO requests (employeeId, employeeName, employeeEmail, branch, type, 
         description, amount, priority, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        data.employeeId, data.employeeName, data.employeeEmail, data.branch,
        data.type, data.description, data.amount, data.priority || 'medium',
        data.status || 'pending', data.notes
      ).run();
      
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    case 'PATCH':
      if (id && id !== 'requests') {
        const updateData = await request.json();
        await db.prepare(
          `UPDATE requests SET status = ?, adminNotes = ?, reviewedBy = ?, reviewedAt = ?, 
           updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(
          updateData.status, updateData.adminNotes, updateData.reviewedBy,
          updateData.reviewedAt, id
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      break;
    
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// Product Requests handler
async function handleProductRequests(request, db, corsHeaders) {
  switch (request.method) {
    case 'GET':
      const requests = await db.prepare(
        'SELECT * FROM product_requests ORDER BY created_at DESC'
      ).all();
      
      return new Response(JSON.stringify(requests.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    case 'POST':
      const data = await request.json();
      const result = await db.prepare(
        `INSERT INTO product_requests (employeeId, employeeName, employeeEmail, branch, 
         productName, quantity, unit, urgency, reason, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        data.employeeId, data.employeeName, data.employeeEmail, data.branch,
        data.productName, data.quantity, data.unit, data.urgency || 'normal',
        data.reason, data.status || 'pending', data.notes
      ).run();
      
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// Bonus handler
async function handleBonus(request, db, corsHeaders) {
  switch (request.method) {
    case 'GET':
      const bonuses = await db.prepare(
        'SELECT * FROM bonuses ORDER BY created_at DESC'
      ).all();
      
      return new Response(JSON.stringify(bonuses.results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    case 'POST':
      const data = await request.json();
      const result = await db.prepare(
        `INSERT INTO bonuses (employeeId, employeeName, branch, amount, type, reason, 
         month, year, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        data.employeeId, data.employeeName, data.branch, data.amount,
        data.type, data.reason, data.month, data.year, data.status || 'pending'
      ).run();
      
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}