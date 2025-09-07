import { NextRequest, NextResponse } from 'next/server';

// Daily Closing type definition
interface DailyClosing {
  id?: number;
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  branchRevenue: number;
  departmentRevenue: number;
  notes?: string;
}

// In-memory storage for development
let dailyClosings: DailyClosing[] = [];
let nextId = 1;

// GET all daily closings or filter by date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    if (date) {
      const closing = dailyClosings.find(dc => dc.date === date);
      return NextResponse.json(closing || null);
    }
    
    return NextResponse.json(dailyClosings);
  } catch (error) {
    console.error('Error fetching daily closings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily closings' },
      { status: 500 }
    );
  }
}

// POST new daily closing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['date', 'totalRevenue', 'totalExpenses', 'netProfit'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check if closing for this date already exists
    const existingIndex = dailyClosings.findIndex(dc => dc.date === body.date);
    
    if (existingIndex !== -1) {
      // Update existing closing
      dailyClosings[existingIndex] = {
        ...dailyClosings[existingIndex],
        ...body
      };
      return NextResponse.json(dailyClosings[existingIndex]);
    }
    
    // Create new daily closing
    const newClosing: DailyClosing = {
      id: nextId++,
      date: body.date,
      totalRevenue: Number(body.totalRevenue) || 0,
      totalExpenses: Number(body.totalExpenses) || 0,
      netProfit: Number(body.netProfit) || 0,
      branchRevenue: Number(body.branchRevenue) || 0,
      departmentRevenue: Number(body.departmentRevenue) || 0,
      notes: body.notes || ''
    };
    
    dailyClosings.push(newClosing);
    
    return NextResponse.json(newClosing, { status: 201 });
  } catch (error) {
    console.error('Error creating daily closing:', error);
    return NextResponse.json(
      { error: 'Failed to create daily closing' },
      { status: 500 }
    );
  }
}

// PUT update daily closing
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id && !body.date) {
      return NextResponse.json(
        { error: 'Daily closing ID or date is required' },
        { status: 400 }
      );
    }
    
    const index = body.id 
      ? dailyClosings.findIndex(dc => dc.id === body.id)
      : dailyClosings.findIndex(dc => dc.date === body.date);
      
    if (index === -1) {
      return NextResponse.json(
        { error: 'Daily closing not found' },
        { status: 404 }
      );
    }
    
    dailyClosings[index] = { ...dailyClosings[index], ...body };
    
    return NextResponse.json(dailyClosings[index]);
  } catch (error) {
    console.error('Error updating daily closing:', error);
    return NextResponse.json(
      { error: 'Failed to update daily closing' },
      { status: 500 }
    );
  }
}