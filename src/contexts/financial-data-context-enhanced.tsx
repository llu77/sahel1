"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Revenue, Expense } from '@/lib/types';
import { 
  createRevenueEnhanced, 
  createExpenseEnhanced,
  getRevenuesEnhanced,
  getExpensesEnhanced,
  updateRevenueEnhanced,
  deleteRevenueEnhanced,
  DatabaseError
} from '@/services/financials-enhanced';
import { branchSyncManager, connectionManager } from '@/lib/firebase-enhanced';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';

interface FinancialDataContextType {
  revenues: Revenue[];
  expenses: Expense[];
  addRevenue: (revenue: Omit<Revenue, 'id'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateRevenue: (id: string, updates: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  loading: boolean;
  syncing: boolean;
  connectionStatus: 'online' | 'offline' | 'syncing';
  lastSyncTime: Date | null;
  refreshData: () => Promise<void>;
  branchFilter: string;
  setBranchFilter: (branch: string) => void;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export function EnhancedFinancialDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>('');
  const { toast } = useToast();

  // Monitor connection status
  useEffect(() => {
    const unsubscribe = connectionManager.addListener((isOnline) => {
      setConnectionStatus(isOnline ? 'online' : 'offline');
      
      if (isOnline) {
        toast({
          title: "🟢 الاتصال مستعاد",
          description: "تمت استعادة الاتصال بقاعدة البيانات",
          duration: 3000
        });
        // Trigger sync when coming back online
        syncData();
      } else {
        toast({
          title: "🔴 انقطع الاتصال",
          description: "العمل في وضع عدم الاتصال - سيتم المزامنة عند عودة الاتصال",
          variant: "destructive",
          duration: 5000
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  // Set up real-time sync for revenues
  useEffect(() => {
    if (!user) return;

    const userBranch = user.branch || '';
    const isAdmin = user.role === 'admin';
    
    // Subscribe to real-time updates for revenues
    const unsubscribeRevenues = branchSyncManager.subscribeToBranch(
      'revenues',
      userBranch,
      (data) => {
        setRevenues(data as Revenue[]);
        setLastSyncTime(new Date());
        console.log(`📊 Revenues updated: ${data.length} items`);
      },
      isAdmin // Admin sees all branches
    );

    // Subscribe to real-time updates for expenses
    const unsubscribeExpenses = branchSyncManager.subscribeToBranch(
      'expenses',
      userBranch,
      (data) => {
        setExpenses(data as Expense[]);
        setLastSyncTime(new Date());
        console.log(`💰 Expenses updated: ${data.length} items`);
      },
      isAdmin // Admin sees all branches
    );

    setLoading(false);

    return () => {
      unsubscribeRevenues();
      unsubscribeExpenses();
    };
  }, [user]);

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      
      const [revenuesData, expensesData] = await Promise.all([
        getRevenuesEnhanced(userBranch, userRole),
        getExpensesEnhanced(userBranch, userRole)
      ]);
      
      setRevenues(revenuesData);
      setExpenses(expensesData);
      setLastSyncTime(new Date());
      
      toast({
        title: "✅ تم تحميل البيانات",
        description: `تم تحميل ${revenuesData.length} إيراد و ${expensesData.length} مصروف`,
        duration: 2000
      });
    } catch (error: any) {
      console.error("Failed to load initial data:", error);
      
      if (error instanceof DatabaseError) {
        toast({
          variant: 'destructive',
          title: "خطأ في تحميل البيانات",
          description: error.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في تحميل البيانات",
          description: "لم نتمكن من تحميل البيانات من قاعدة البيانات"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    if (syncing || !user) return;
    
    try {
      setSyncing(true);
      setConnectionStatus('syncing');
      
      await loadInitialData();
      
      toast({
        title: "✅ تمت المزامنة",
        description: "تم تحديث جميع البيانات بنجاح",
        duration: 2000
      });
    } catch (error) {
      console.error("Sync failed:", error);
      toast({
        variant: 'destructive',
        title: "فشلت المزامنة",
        description: "لم نتمكن من مزامنة البيانات"
      });
    } finally {
      setSyncing(false);
      setConnectionStatus(connectionManager.getStatus() ? 'online' : 'offline');
    }
  };

  const addRevenue = async (revenueData: Omit<Revenue, 'id'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً"
      });
      return;
    }

    try {
      setSyncing(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      
      const newRevenue = await createRevenueEnhanced(
        revenueData,
        userBranch,
        userRole
      );
      
      // Optimistically update local state
      setRevenues(prev => [newRevenue, ...prev]);
      
      toast({
        title: "✅ تمت إضافة الإيراد",
        description: `تمت إضافة إيراد بمبلغ ${revenueData.totalAmount} ريال`,
        duration: 3000
      });
    } catch (error: any) {
      console.error("Failed to add revenue:", error);
      
      if (error instanceof DatabaseError) {
        if (error.code === 'BRANCH_ACCESS_DENIED') {
          toast({
            variant: 'destructive',
            title: "غير مسموح",
            description: error.message
          });
        } else if (error.code === 'VALIDATION_ERROR') {
          toast({
            variant: 'destructive',
            title: "خطأ في البيانات",
            description: error.message
          });
        } else {
          toast({
            variant: 'destructive',
            title: "خطأ في الحفظ",
            description: error.message
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في إضافة الإيراد",
          description: "لم نتمكن من حفظ البيانات. يرجى المحاولة مرة أخرى"
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً"
      });
      return;
    }

    try {
      setSyncing(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      
      const newExpense = await createExpenseEnhanced(
        expenseData,
        userBranch,
        userRole
      );
      
      // Optimistically update local state
      setExpenses(prev => [newExpense, ...prev]);
      
      toast({
        title: "✅ تمت إضافة المصروف",
        description: `تمت إضافة مصروف بمبلغ ${expenseData.amount} ريال`,
        duration: 3000
      });
    } catch (error: any) {
      console.error("Failed to add expense:", error);
      
      if (error instanceof DatabaseError) {
        if (error.code === 'BRANCH_ACCESS_DENIED') {
          toast({
            variant: 'destructive',
            title: "غير مسموح",
            description: error.message
          });
        } else if (error.code === 'VALIDATION_ERROR') {
          toast({
            variant: 'destructive',
            title: "خطأ في البيانات",
            description: error.message
          });
        } else {
          toast({
            variant: 'destructive',
            title: "خطأ في الحفظ",
            description: error.message
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في إضافة المصروف",
          description: "لم نتمكن من حفظ البيانات. يرجى المحاولة مرة أخرى"
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const updateRevenue = async (id: string, updates: Partial<Revenue>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً"
      });
      return;
    }

    try {
      setSyncing(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      
      await updateRevenueEnhanced(id, updates, userBranch, userRole);
      
      // Optimistically update local state
      setRevenues(prev => prev.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ));
      
      toast({
        title: "✅ تم التحديث",
        description: "تم تحديث الإيراد بنجاح",
        duration: 2000
      });
    } catch (error: any) {
      console.error("Failed to update revenue:", error);
      
      if (error instanceof DatabaseError) {
        toast({
          variant: 'destructive',
          title: "خطأ في التحديث",
          description: error.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في التحديث",
          description: "لم نتمكن من تحديث البيانات"
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const deleteRevenue = async (id: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً"
      });
      return;
    }

    try {
      setSyncing(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      
      await deleteRevenueEnhanced(id, userBranch, userRole);
      
      // Optimistically update local state
      setRevenues(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف الإيراد بنجاح",
        duration: 2000
      });
    } catch (error: any) {
      console.error("Failed to delete revenue:", error);
      
      if (error instanceof DatabaseError) {
        toast({
          variant: 'destructive',
          title: "خطأ في الحذف",
          description: error.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في الحذف",
          description: "لم نتمكن من حذف البيانات"
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const refreshData = useCallback(async () => {
    await syncData();
  }, [user]);

  // Filtered data based on branch
  const filteredRevenues = React.useMemo(() => {
    if (!branchFilter || branchFilter === 'all') return revenues;
    return revenues.filter(r => r.branch === branchFilter);
  }, [revenues, branchFilter]);

  const filteredExpenses = React.useMemo(() => {
    if (!branchFilter || branchFilter === 'all') return expenses;
    return expenses.filter(e => e.branch === branchFilter);
  }, [expenses, branchFilter]);

  return (
    <FinancialDataContext.Provider 
      value={{ 
        revenues: filteredRevenues,
        expenses: filteredExpenses,
        addRevenue,
        addExpense,
        updateRevenue,
        deleteRevenue,
        loading,
        syncing,
        connectionStatus,
        lastSyncTime,
        refreshData,
        branchFilter,
        setBranchFilter
      }}
    >
      {children}
      
      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 left-4 z-50">
        {connectionStatus === 'offline' && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm">وضع عدم الاتصال</span>
          </div>
        )}
        {connectionStatus === 'syncing' && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm">جاري المزامنة...</span>
          </div>
        )}
        {connectionStatus === 'online' && lastSyncTime && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 opacity-0 animate-fade-in">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-sm">متصل</span>
          </div>
        )}
      </div>
    </FinancialDataContext.Provider>
  );
}

export function useEnhancedFinancialData() {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useEnhancedFinancialData must be used within an EnhancedFinancialDataProvider');
  }
  return context;
}