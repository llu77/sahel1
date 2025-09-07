import { NextRequest, NextResponse } from 'next/server';
import { readData, addItem, writeData } from '@/lib/db-storage';
import fs from 'fs';
import path from 'path';

const RULES_FILE = path.join(process.cwd(), 'data', 'bonus_rules.json');

// Initialize rules file if it doesn't exist
if (!fs.existsSync(RULES_FILE)) {
  const defaultRules = {
    laban: [
      { id: 'laban-1', branch: 'laban', weeklyIncomeThreshold: 50000, bonusAmount: 1000 },
      { id: 'laban-2', branch: 'laban', weeklyIncomeThreshold: 40000, bonusAmount: 800 },
      { id: 'laban-3', branch: 'laban', weeklyIncomeThreshold: 30000, bonusAmount: 600 },
      { id: 'laban-4', branch: 'laban', weeklyIncomeThreshold: 20000, bonusAmount: 400 },
      { id: 'laban-5', branch: 'laban', weeklyIncomeThreshold: 10000, bonusAmount: 200 },
      { id: 'laban-6', branch: 'laban', weeklyIncomeThreshold: 0, bonusAmount: 0 }
    ],
    tuwaiq: [
      { id: 'tuwaiq-1', branch: 'tuwaiq', weeklyIncomeThreshold: 50000, bonusAmount: 1000 },
      { id: 'tuwaiq-2', branch: 'tuwaiq', weeklyIncomeThreshold: 40000, bonusAmount: 800 },
      { id: 'tuwaiq-3', branch: 'tuwaiq', weeklyIncomeThreshold: 30000, bonusAmount: 600 },
      { id: 'tuwaiq-4', branch: 'tuwaiq', weeklyIncomeThreshold: 20000, bonusAmount: 400 },
      { id: 'tuwaiq-5', branch: 'tuwaiq', weeklyIncomeThreshold: 10000, bonusAmount: 200 },
      { id: 'tuwaiq-6', branch: 'tuwaiq', weeklyIncomeThreshold: 0, bonusAmount: 0 }
    ]
  };
  fs.writeFileSync(RULES_FILE, JSON.stringify(defaultRules, null, 2), 'utf8');
}

// Read bonus rules
function readBonusRules() {
  try {
    const data = fs.readFileSync(RULES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bonus rules:', error);
    return { laban: [], tuwaiq: [] };
  }
}

// Write bonus rules
function writeBonusRules(rules: any) {
  try {
    fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing bonus rules:', error);
    return false;
  }
}

// GET bonus rules by branch
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branch = searchParams.get('branch');
    
    if (!branch || (branch !== 'laban' && branch !== 'tuwaiq')) {
      return NextResponse.json(
        { error: 'Valid branch (laban or tuwaiq) is required' },
        { status: 400 }
      );
    }
    
    const rules = readBonusRules();
    const branchRules = rules[branch] || [];
    
    // Sort by threshold descending
    branchRules.sort((a: any, b: any) => b.weeklyIncomeThreshold - a.weeklyIncomeThreshold);
    
    return NextResponse.json(branchRules);
  } catch (error) {
    console.error('Error fetching bonus rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bonus rules' },
      { status: 500 }
    );
  }
}

// POST new bonus rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.branch || !body.weeklyIncomeThreshold === undefined || body.bonusAmount === undefined) {
      return NextResponse.json(
        { error: 'Branch, weeklyIncomeThreshold, and bonusAmount are required' },
        { status: 400 }
      );
    }
    
    const rules = readBonusRules();
    const branchRules = rules[body.branch] || [];
    
    const newRule = {
      id: `${body.branch}-${Date.now()}`,
      branch: body.branch,
      weeklyIncomeThreshold: Number(body.weeklyIncomeThreshold),
      bonusAmount: Number(body.bonusAmount)
    };
    
    branchRules.push(newRule);
    rules[body.branch] = branchRules;
    
    writeBonusRules(rules);
    
    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error('Error creating bonus rule:', error);
    return NextResponse.json(
      { error: 'Failed to create bonus rule' },
      { status: 500 }
    );
  }
}

// PUT update all rules for a branch
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.branch || !Array.isArray(body.rules)) {
      return NextResponse.json(
        { error: 'Branch and rules array are required' },
        { status: 400 }
      );
    }
    
    const rules = readBonusRules();
    
    // Update rules for the branch
    rules[body.branch] = body.rules.map((rule: any, index: number) => ({
      id: rule.id || `${body.branch}-${Date.now()}-${index}`,
      branch: body.branch,
      weeklyIncomeThreshold: Number(rule.weeklyIncomeThreshold),
      bonusAmount: Number(rule.bonusAmount)
    }));
    
    writeBonusRules(rules);
    
    return NextResponse.json({ message: 'Rules updated successfully', rules: rules[body.branch] });
  } catch (error) {
    console.error('Error updating bonus rules:', error);
    return NextResponse.json(
      { error: 'Failed to update bonus rules' },
      { status: 500 }
    );
  }
}

// DELETE a bonus rule
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ruleId = searchParams.get('id');
    const branch = searchParams.get('branch');
    
    if (!ruleId || !branch) {
      return NextResponse.json(
        { error: 'Rule ID and branch are required' },
        { status: 400 }
      );
    }
    
    const rules = readBonusRules();
    const branchRules = rules[branch] || [];
    
    rules[branch] = branchRules.filter((rule: any) => rule.id !== ruleId);
    
    writeBonusRules(rules);
    
    return NextResponse.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting bonus rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete bonus rule' },
      { status: 500 }
    );
  }
}