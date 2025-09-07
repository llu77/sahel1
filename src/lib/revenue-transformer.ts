// Transform revenue data to include employee contributions properly

export interface EmployeeContribution {
  name: string;
  amount: number;
}

export interface TransformedRevenue {
  id: string | number;
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
  branch?: string;
  totalAmount?: number;
  cashAmount?: number;
  networkAmount?: number;
  employeeContributions: EmployeeContribution[];
}

// Parse employee contributions from revenue data
export function parseEmployeeContributions(revenue: any): EmployeeContribution[] {
  // If already has employee contributions, return them
  if (revenue.employeeContributions && Array.isArray(revenue.employeeContributions)) {
    return revenue.employeeContributions;
  }
  
  // For now, distribute revenue equally among default employees
  const branch = revenue.documentType || revenue.branch || 'laban';
  const defaultEmployees = {
    laban: ['عبدالحي جلال', 'محمود عمارة', 'علاء ناصر', 'السيد'],
    tuwaiq: ['محمد إسماعيل', 'محمد ناصر', 'فارس', 'السيد']
  };
  
  const employees = defaultEmployees[branch as keyof typeof defaultEmployees] || defaultEmployees.laban;
  const amountPerEmployee = (revenue.totalAfterDiscount || revenue.amount || 0) / employees.length;
  
  return employees.map(name => ({
    name,
    amount: Math.round(amountPerEmployee)
  }));
}

// Transform API revenue to include all needed fields
export function transformRevenue(apiRevenue: any): TransformedRevenue {
  // Extract cash and network amounts from paymentMethod
  let cashAmount = 0;
  let networkAmount = 0;
  
  if (apiRevenue.paymentMethod) {
    const cashMatch = apiRevenue.paymentMethod.match(/(\d+)/);
    const allNumbers = apiRevenue.paymentMethod.match(/\d+/g);
    
    if (cashMatch) {
      cashAmount = parseFloat(cashMatch[1]) || 0;
    }
    
    if (allNumbers && allNumbers.length > 1) {
      networkAmount = parseFloat(allNumbers[1]) || 0;
    }
  }
  
  return {
    ...apiRevenue,
    branch: apiRevenue.documentType || apiRevenue.branch || 'laban',
    totalAmount: apiRevenue.totalAfterDiscount || apiRevenue.amount || 0,
    cashAmount,
    networkAmount,
    employeeContributions: parseEmployeeContributions(apiRevenue),
    date: apiRevenue.date || new Date().toISOString().split('T')[0]
  };
}

// Calculate bonus for an employee based on their weekly revenue
export function calculateEmployeeBonus(weeklyRevenue: number, bonusRules: any[]): number {
  for (const rule of bonusRules) {
    if (weeklyRevenue >= rule.weeklyIncomeThreshold) {
      return rule.bonusAmount;
    }
  }
  return 0;
}

// Get employee revenues for a specific period
export function getEmployeeRevenues(
  revenues: any[], 
  employeeName: string, 
  startDate: Date, 
  endDate: Date
): number {
  return revenues.reduce((total, revenue) => {
    const revenueDate = new Date(revenue.date);
    if (revenueDate >= startDate && revenueDate <= endDate) {
      const contributions = revenue.employeeContributions || parseEmployeeContributions(revenue);
      const contribution = contributions.find((c: any) => c.name === employeeName);
      if (contribution) {
        total += contribution.amount || 0;
      }
    }
    return total;
  }, 0);
}