import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const REQUESTS_FILE = path.join(process.cwd(), 'data', 'employee_requests.json');

// Initialize file if it doesn't exist
if (!fs.existsSync(REQUESTS_FILE)) {
  fs.writeFileSync(REQUESTS_FILE, '[]', 'utf8');
}

// Read employee requests
function readEmployeeRequests() {
  try {
    const data = fs.readFileSync(REQUESTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading employee requests:', error);
    return [];
  }
}

// Write employee requests
function writeEmployeeRequests(requests: any[]) {
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing employee requests:', error);
    return false;
  }
}

// GET all employee requests
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    
    let requests = readEmployeeRequests();
    
    // Filter by status
    if (status) {
      requests = requests.filter((r: any) => r.status === status);
    }
    
    // Filter by branch
    if (branch) {
      requests = requests.filter((r: any) => r.branch === branch);
    }
    
    // Filter by user (for user's own requests)
    if (userId) {
      requests = requests.filter((r: any) => r.userId === userId);
    }
    
    // Filter by type
    if (type) {
      requests = requests.filter((r: any) => r.type === type);
    }
    
    // Sort by submission date descending
    requests.sort((a: any, b: any) => 
      new Date(b.submittedAt || b.created_at).getTime() - new Date(a.submittedAt || a.created_at).getTime()
    );
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching employee requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee requests' },
      { status: 500 }
    );
  }
}

// POST new employee request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !['leave', 'advance', 'resignation', 'overtime'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }
    
    if (!body.employeeName || !body.branch || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeName, branch, userId' },
        { status: 400 }
      );
    }
    
    const requests = readEmployeeRequests();
    
    const newRequest = {
      id: `REQ-${Date.now()}`,
      type: body.type,
      title: body.title || '',
      employeeName: body.employeeName,
      userId: body.userId,
      branch: body.branch,
      reason: body.reason || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Type-specific fields
      ...(body.type === 'leave' && {
        startDate: body.startDate,
        endDate: body.endDate
      }),
      ...(body.type === 'advance' && {
        amount: body.amount
      }),
      ...(body.type === 'resignation' && {
        lastWorkingDay: body.lastWorkingDay
      }),
      ...(body.type === 'overtime' && {
        date: body.date,
        hours: body.hours
      })
    };
    
    requests.push(newRequest);
    writeEmployeeRequests(requests);
    
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating employee request:', error);
    return NextResponse.json(
      { error: 'Failed to create employee request' },
      { status: 500 }
    );
  }
}

// PUT update employee request (mainly for status updates by admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    const requests = readEmployeeRequests();
    const index = requests.findIndex((r: any) => r.id === body.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Employee request not found' },
        { status: 404 }
      );
    }
    
    // Update the request
    requests[index] = {
      ...requests[index],
      ...body,
      updated_at: new Date().toISOString(),
      ...(body.status && body.status !== 'pending' && {
        reviewedAt: new Date().toISOString()
      })
    };
    
    writeEmployeeRequests(requests);
    
    return NextResponse.json(requests[index]);
  } catch (error) {
    console.error('Error updating employee request:', error);
    return NextResponse.json(
      { error: 'Failed to update employee request' },
      { status: 500 }
    );
  }
}

// DELETE employee request
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    const requests = readEmployeeRequests();
    const filtered = requests.filter((r: any) => r.id !== id);
    
    if (filtered.length === requests.length) {
      return NextResponse.json(
        { error: 'Employee request not found' },
        { status: 404 }
      );
    }
    
    writeEmployeeRequests(filtered);
    
    return NextResponse.json({ message: 'Employee request deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee request:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee request' },
      { status: 500 }
    );
  }
}