import { NextRequest, NextResponse } from 'next/server';
import { readData, addItem, updateItem, deleteItem, getItemsByDate } from '@/lib/db-storage';

// Revenue type definition
interface Revenue {
  id?: number;
  documentNumber: string;
  documentType: string;
  amount: number;
  discount: number;
  totalAfterDiscount: number;
  percentage: number;
  date: string;
  paymentMethod: string;
  branchRevenue: number;
  departmentRevenue: number;
  notes?: string;
  mismatchReason?: string;
}

// GET all revenues or filter by date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    let revenues = readData('revenues');
    
    if (date) {
      revenues = revenues.filter((r: Revenue) => r.date === date);
    }
    
    return NextResponse.json(revenues);
  } catch (error) {
    console.error('Error fetching revenues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenues' },
      { status: 500 }
    );
  }
}

// POST new revenue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['documentNumber', 'documentType', 'amount', 'date', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create new revenue with defaults
    const newRevenue = {
      documentNumber: body.documentNumber,
      documentType: body.documentType,
      amount: Number(body.amount) || 0,
      discount: Number(body.discount) || 0,
      totalAfterDiscount: Number(body.totalAfterDiscount) || Number(body.amount),
      percentage: Number(body.percentage) || 0,
      date: body.date,
      paymentMethod: body.paymentMethod,
      branchRevenue: Number(body.branchRevenue) || 0,
      departmentRevenue: Number(body.departmentRevenue) || 0,
      notes: body.notes || '',
      mismatchReason: body.mismatchReason || '',
      employeeContributions: body.employeeContributions || [],
      branch: body.branch || body.documentType
    };
    
    const savedRevenue = addItem('revenues', newRevenue);
    
    return NextResponse.json(savedRevenue, { status: 201 });
  } catch (error) {
    console.error('Error creating revenue:', error);
    return NextResponse.json(
      { error: 'Failed to create revenue' },
      { status: 500 }
    );
  }
}

// PUT update revenue
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Revenue ID is required' },
        { status: 400 }
      );
    }
    
    const updatedRevenue = updateItem('revenues', body.id, body);
    
    if (!updatedRevenue) {
      return NextResponse.json(
        { error: 'Revenue not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedRevenue);
  } catch (error) {
    console.error('Error updating revenue:', error);
    return NextResponse.json(
      { error: 'Failed to update revenue' },
      { status: 500 }
    );
  }
}

// DELETE revenue
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Revenue ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = deleteItem('revenues', Number(id));
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Revenue not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Revenue deleted successfully' });
  } catch (error) {
    console.error('Error deleting revenue:', error);
    return NextResponse.json(
      { error: 'Failed to delete revenue' },
      { status: 500 }
    );
  }
}