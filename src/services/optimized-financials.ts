import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  writeBatch,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { optimizedDb, firebaseCache, BatchOperations, PaginationHelper } from '@/lib/firebase-performance';
import type { Revenue, Expense, BonusRule } from '@/lib/types';
import { performanceMonitor, memoize } from '@/lib/performance-utils';

// Optimized Revenue Service
export class OptimizedRevenueService {
  private readonly collectionName = 'revenues';
  private readonly cachePrefix = 'revenue_';
  private batchOps = new BatchOperations();
  private pagination = new PaginationHelper<Revenue>(50);

  // Get revenues with caching and pagination
  async getRevenues(branch?: string, page: number = 1): Promise<Revenue[]> {
    const cacheKey = `${this.cachePrefix}${branch || 'all'}_${page}`;
    
    return performanceMonitor.measureAsync(`getRevenues_${branch}_${page}`, async () => {
      // Check cache first
      const cached = firebaseCache.get(cacheKey);
      if (cached) return cached;

      const constraints = [];
      if (branch) {
        constraints.push(where('branch', '==', branch));
      }
      constraints.push(orderBy('date', 'desc'));

      const { data } = await this.pagination.getPage(this.collectionName, constraints);
      
      // Cache the result
      firebaseCache.set(cacheKey, data);
      
      return data;
    });
  }

  // Get revenues by date range with optimization
  async getRevenuesByDateRange(
    startDate: Date,
    endDate: Date,
    branch?: string
  ): Promise<Revenue[]> {
    const cacheKey = `${this.cachePrefix}range_${startDate.getTime()}_${endDate.getTime()}_${branch || 'all'}`;
    
    const cached = firebaseCache.get(cacheKey);
    if (cached) return cached;

    const constraints = [
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    ];
    
    if (branch) {
      constraints.push(where('branch', '==', branch));
    }

    const q = query(collection(optimizedDb, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);
    
    const revenues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Revenue[];

    firebaseCache.set(cacheKey, revenues);
    
    return revenues;
  }

  // Add revenue with batch optimization
  async addRevenue(revenue: Omit<Revenue, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(optimizedDb, this.collectionName), {
      ...revenue,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Invalidate cache
    firebaseCache.invalidate(this.cachePrefix);
    
    return docRef.id;
  }

  // Batch add revenues
  async addRevenueBatch(revenues: Omit<Revenue, 'id'>[]): Promise<void> {
    const batch = writeBatch(optimizedDb);
    
    revenues.forEach(revenue => {
      const docRef = doc(collection(optimizedDb, this.collectionName));
      batch.set(docRef, {
        ...revenue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    firebaseCache.invalidate(this.cachePrefix);
  }

  // Update revenue
  async updateRevenue(id: string, data: Partial<Revenue>): Promise<void> {
    await updateDoc(doc(optimizedDb, this.collectionName, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    firebaseCache.invalidate(this.cachePrefix);
  }

  // Delete revenue
  async deleteRevenue(id: string): Promise<void> {
    await deleteDoc(doc(optimizedDb, this.collectionName, id));
    firebaseCache.invalidate(this.cachePrefix);
  }

  // Real-time subscription with optimization
  subscribeToRevenues(
    callback: (revenues: Revenue[]) => void,
    branch?: string
  ): Unsubscribe {
    const constraints = [];
    if (branch) {
      constraints.push(where('branch', '==', branch));
    }
    constraints.push(orderBy('date', 'desc'), limit(100));

    const q = query(collection(optimizedDb, this.collectionName), ...constraints);
    
    return onSnapshot(q, 
      { includeMetadataChanges: false },
      (snapshot) => {
        const revenues = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Revenue[];
        
        callback(revenues);
        
        // Update cache
        const cacheKey = `${this.cachePrefix}${branch || 'all'}_1`;
        firebaseCache.set(cacheKey, revenues);
      }
    );
  }

  // Get aggregated statistics (memoized)
  getStatistics = memoize(async (branch?: string) => {
    const revenues = await this.getRevenues(branch);
    
    const totalRevenue = revenues.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalCash = revenues.reduce((sum, r) => sum + r.cashAmount, 0);
    const totalNetwork = revenues.reduce((sum, r) => sum + r.networkAmount, 0);
    
    const employeeStats = new Map<string, number>();
    revenues.forEach(r => {
      r.employeeContributions.forEach(c => {
        const current = employeeStats.get(c.name) || 0;
        employeeStats.set(c.name, current + c.amount);
      });
    });
    
    return {
      totalRevenue,
      totalCash,
      totalNetwork,
      employeeStats: Array.from(employeeStats.entries()).map(([name, amount]) => ({
        name,
        amount
      })).sort((a, b) => b.amount - a.amount)
    };
  });
}

// Optimized Expense Service
export class OptimizedExpenseService {
  private readonly collectionName = 'expenses';
  private readonly cachePrefix = 'expense_';
  private pagination = new PaginationHelper<Expense>(50);

  async getExpenses(branch?: string, page: number = 1): Promise<Expense[]> {
    const cacheKey = `${this.cachePrefix}${branch || 'all'}_${page}`;
    
    const cached = firebaseCache.get(cacheKey);
    if (cached) return cached;

    const constraints = [];
    if (branch) {
      constraints.push(where('branch', '==', branch));
    }
    constraints.push(orderBy('date', 'desc'));

    const { data } = await this.pagination.getPage(this.collectionName, constraints);
    
    firebaseCache.set(cacheKey, data);
    
    return data;
  }

  async getExpensesByCategory(category: string, branch?: string): Promise<Expense[]> {
    const cacheKey = `${this.cachePrefix}cat_${category}_${branch || 'all'}`;
    
    const cached = firebaseCache.get(cacheKey);
    if (cached) return cached;

    const constraints = [
      where('category', '==', category),
      orderBy('date', 'desc')
    ];
    
    if (branch) {
      constraints.push(where('branch', '==', branch));
    }

    const q = query(collection(optimizedDb, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);
    
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expense[];

    firebaseCache.set(cacheKey, expenses);
    
    return expenses;
  }

  async addExpense(expense: Omit<Expense, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(optimizedDb, this.collectionName), {
      ...expense,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    firebaseCache.invalidate(this.cachePrefix);
    
    return docRef.id;
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<void> {
    await updateDoc(doc(optimizedDb, this.collectionName, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    firebaseCache.invalidate(this.cachePrefix);
  }

  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(optimizedDb, this.collectionName, id));
    firebaseCache.invalidate(this.cachePrefix);
  }

  subscribeToExpenses(
    callback: (expenses: Expense[]) => void,
    branch?: string
  ): Unsubscribe {
    const constraints = [];
    if (branch) {
      constraints.push(where('branch', '==', branch));
    }
    constraints.push(orderBy('date', 'desc'), limit(100));

    const q = query(collection(optimizedDb, this.collectionName), ...constraints);
    
    return onSnapshot(q,
      { includeMetadataChanges: false },
      (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Expense[];
        
        callback(expenses);
        
        const cacheKey = `${this.cachePrefix}${branch || 'all'}_1`;
        firebaseCache.set(cacheKey, expenses);
      }
    );
  }

  // Get expense statistics by category
  getStatisticsByCategory = memoize(async (branch?: string) => {
    const expenses = await this.getExpenses(branch);
    
    const categoryStats = new Map<string, number>();
    let totalExpenses = 0;
    
    expenses.forEach(e => {
      totalExpenses += e.amount;
      const current = categoryStats.get(e.category) || 0;
      categoryStats.set(e.category, current + e.amount);
    });
    
    return {
      totalExpenses,
      byCategory: Array.from(categoryStats.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100
      })).sort((a, b) => b.amount - a.amount)
    };
  });
}

// Optimized Bonus Rules Service
export class OptimizedBonusRulesService {
  private readonly collectionName = 'bonusRules';
  private readonly cachePrefix = 'bonus_';

  async getBonusRules(branch: string): Promise<BonusRule[]> {
    const cacheKey = `${this.cachePrefix}${branch}`;
    
    const cached = firebaseCache.get(cacheKey);
    if (cached) return cached;

    const q = query(
      collection(optimizedDb, this.collectionName),
      where('branch', '==', branch),
      orderBy('weeklyIncomeThreshold', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const rules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BonusRule[];

    firebaseCache.set(cacheKey, rules);
    
    return rules;
  }

  async addBonusRule(rule: Omit<BonusRule, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(optimizedDb, this.collectionName), {
      ...rule,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    firebaseCache.invalidate(this.cachePrefix);
    
    return docRef.id;
  }

  async updateBonusRule(id: string, data: Partial<BonusRule>): Promise<void> {
    await updateDoc(doc(optimizedDb, this.collectionName, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    firebaseCache.invalidate(this.cachePrefix);
  }

  async deleteBonusRule(id: string): Promise<void> {
    await deleteDoc(doc(optimizedDb, this.collectionName, id));
    firebaseCache.invalidate(this.cachePrefix);
  }

  // Calculate bonus for employee
  calculateBonus = memoize(async (
    employeeName: string,
    branch: string,
    month: number,
    year: number
  ) => {
    const rules = await this.getBonusRules(branch);
    const revenueService = new OptimizedRevenueService();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const revenues = await revenueService.getRevenuesByDateRange(startDate, endDate, branch);
    
    const weeklyIncomes = new Map<number, number>();
    
    revenues.forEach(r => {
      const week = Math.floor((r.date.getDate() - 1) / 7);
      const contribution = r.employeeContributions.find(c => c.name === employeeName);
      if (contribution) {
        const current = weeklyIncomes.get(week) || 0;
        weeklyIncomes.set(week, current + contribution.amount);
      }
    });
    
    let totalBonus = 0;
    weeklyIncomes.forEach(income => {
      for (const rule of rules) {
        if (income >= rule.weeklyIncomeThreshold) {
          totalBonus += rule.bonusAmount;
          break;
        }
      }
    });
    
    return {
      employeeName,
      month,
      year,
      weeklyIncomes: Array.from(weeklyIncomes.entries()),
      totalBonus
    };
  });
}

// Export singleton instances
export const optimizedRevenueService = new OptimizedRevenueService();
export const optimizedExpenseService = new OptimizedExpenseService();
export const optimizedBonusRulesService = new OptimizedBonusRulesService();

// Clear all caches
export function clearAllCaches(): void {
  firebaseCache.clear();
}