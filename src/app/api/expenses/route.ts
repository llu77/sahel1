import { NextRequest, NextResponse } from 'next/server';
import { readData, addItem, updateItem, deleteItem, getItemsByDate } from '@/lib/db-storage';

// Expense type definition
interface Expense {
  id?: number;
  amount: number;
  date: string;
  reason: string;
  type: string;
  category: string;
  details?: string;
}

// GET all expenses or filter by date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    let expenses = readData('expenses');
    
    if (date) {
      expenses = expenses.filter((e: Expense) => e.date === date);
    }
    
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['amount', 'date', 'reason', 'type', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create new expense
    const newExpense = {
      amount: Number(body.amount) || 0,
      date: body.date,
      reason: body.reason,
      type: body.type,
      category: body.category,
      details: body.details || ''
    };
    
    const savedExpense = addItem('expenses', newExpense);
    
    return NextResponse.json(savedExpense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

// PUT update expense
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }
    
    const updatedExpense = updateItem('expenses', body.id, body);
    
    if (!updatedExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE expense
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = deleteItem('expenses', Number(id));
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}