import { NextRequest, NextResponse } from 'next/server';
import { readData, addItem, updateItem, deleteItem } from '@/lib/db-storage';
import fs from 'fs';
import path from 'path';

const REQUESTS_FILE = path.join(process.cwd(), 'data', 'product_requests.json');

// Initialize file if it doesn't exist
if (!fs.existsSync(REQUESTS_FILE)) {
  fs.writeFileSync(REQUESTS_FILE, '[]', 'utf8');
}

// Read product requests
function readProductRequests() {
  try {
    const data = fs.readFileSync(REQUESTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading product requests:', error);
    return [];
  }
}

// Write product requests
function writeProductRequests(requests: any[]) {
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing product requests:', error);
    return false;
  }
}

// GET all product requests
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');
    
    let requests = readProductRequests();
    
    if (status) {
      requests = requests.filter((r: any) => r.status === status);
    }
    
    if (branch) {
      requests = requests.filter((r: any) => r.branch === branch);
    }
    
    // Sort by date descending
    requests.sort((a: any, b: any) => 
      new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
    );
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching product requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product requests' },
      { status: 500 }
    );
  }
}

// POST new product request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const requests = readProductRequests();
    
    const newRequest = {
      id: `PR-${Date.now()}`,
      requestNumber: `PR-${Date.now()}`,
      date: body.date || new Date().toISOString(),
      branch: body.branch || 'main',
      employeeName: body.employeeName || '',
      products: body.products || [],
      totalQuantity: body.totalQuantity || 0,
      totalPrice: body.totalPrice || 0,
      status: body.status || 'pending',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    requests.push(newRequest);
    writeProductRequests(requests);
    
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating product request:', error);
    return NextResponse.json(
      { error: 'Failed to create product request' },
      { status: 500 }
    );
  }
}

// PUT update product request
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    const requests = readProductRequests();
    const index = requests.findIndex((r: any) => r.id === body.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Product request not found' },
        { status: 404 }
      );
    }
    
    requests[index] = {
      ...requests[index],
      ...body,
      updated_at: new Date().toISOString()
    };
    
    writeProductRequests(requests);
    
    return NextResponse.json(requests[index]);
  } catch (error) {
    console.error('Error updating product request:', error);
    return NextResponse.json(
      { error: 'Failed to update product request' },
      { status: 500 }
    );
  }
}

// DELETE product request
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
    
    const requests = readProductRequests();
    const filtered = requests.filter((r: any) => r.id !== id);
    
    if (filtered.length === requests.length) {
      return NextResponse.json(
        { error: 'Product request not found' },
        { status: 404 }
      );
    }
    
    writeProductRequests(filtered);
    
    return NextResponse.json({ message: 'Product request deleted successfully' });
  } catch (error) {
    console.error('Error deleting product request:', error);
    return NextResponse.json(
      { error: 'Failed to delete product request' },
      { status: 500 }
    );
  }
}