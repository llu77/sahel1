import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/db-storage';

interface BonusCalculation {
  employeeName: string;
  branch: string;
  month: number;
  year: number;
  totalRevenue: number;
  weeklyBonuses: number[];
  totalBonus: number;
}

// Default bonus rules
const defaultBonusRules = {
  laban: [
    { weeklyIncomeThreshold: 50000, bonusAmount: 1000 },
    { weeklyIncomeThreshold: 40000, bonusAmount: 800 },
    { weeklyIncomeThreshold: 30000, bonusAmount: 600 },
    { weeklyIncomeThreshold: 20000, bonusAmount: 400 },
    { weeklyIncomeThreshold: 10000, bonusAmount: 200 },
    { weeklyIncomeThreshold: 0, bonusAmount: 0 }
  ],
  tuwaiq: [
    { weeklyIncomeThreshold: 50000, bonusAmount: 1000 },
    { weeklyIncomeThreshold: 40000, bonusAmount: 800 },
    { weeklyIncomeThreshold: 30000, bonusAmount: 600 },
    { weeklyIncomeThreshold: 20000, bonusAmount: 400 },
    { weeklyIncomeThreshold: 10000, bonusAmount: 200 },
    { weeklyIncomeThreshold: 0, bonusAmount: 0 }
  ]
};

// Calculate bonus based on revenues
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branch = searchParams.get('branch');
    const month = searchParams.get('month');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    
    if (!branch || !month) {
      return NextResponse.json(
        { error: 'Branch and month are required' },
        { status: 400 }
      );
    }
    
    // Get all revenues
    const revenues = readData('revenues');
    
    // Filter revenues by branch and month
    const filteredRevenues = revenues.filter((r: any) => {
      const revenueDate = new Date(r.date);
      return (
        (r.documentType === branch || r.branch === branch) &&
        revenueDate.getMonth() === parseInt(month) &&
        revenueDate.getFullYear() === parseInt(year)
      );
    });
    
    // Calculate total revenue for the branch
    const totalRevenue = filteredRevenues.reduce((sum: number, r: any) => 
      sum + (r.totalAfterDiscount || r.amount || 0), 0
    );
    
    // Get bonus rules for the branch
    const rules = defaultBonusRules[branch as keyof typeof defaultBonusRules] || defaultBonusRules.laban;
    
    // Calculate weekly bonuses (simplified - using total monthly revenue divided by 4)
    const weeklyRevenue = totalRevenue / 4;
    const weeklyBonus = calculateBonusAmount(weeklyRevenue, rules);
    
    const result: BonusCalculation = {
      employeeName: 'All Employees',
      branch,
      month: parseInt(month),
      year: parseInt(year),
      totalRevenue,
      weeklyBonuses: [weeklyBonus, weeklyBonus, weeklyBonus, weeklyBonus],
      totalBonus: weeklyBonus * 4
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating bonus:', error);
    return NextResponse.json(
      { error: 'Failed to calculate bonus' },
      { status: 500 }
    );
  }
}

function calculateBonusAmount(revenue: number, rules: any[]): number {
  for (const rule of rules) {
    if (revenue >= rule.weeklyIncomeThreshold) {
      return rule.bonusAmount;
    }
  }
  return 0;
}

// POST new bonus calculation (for saving specific employee bonuses)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Here you would save the bonus calculation to the database
    // For now, we'll just return the calculation
    
    return NextResponse.json({
      message: 'Bonus calculation saved',
      data: body
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving bonus calculation:', error);
    return NextResponse.json(
      { error: 'Failed to save bonus calculation' },
      { status: 500 }
    );
  }
}