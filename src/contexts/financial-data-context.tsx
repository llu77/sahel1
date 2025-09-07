"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Revenue, Expense } from '@/lib/types';
import { getRevenues, createRevenue, getExpenses, createExpense } from '@/services/financials';
import { useToast } from "@/hooks/use-toast";

interface FinancialDataContextType {
  revenues: Revenue[];
  expenses: Expense[];
  addRevenue: (revenue: Omit<Revenue, 'id'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  loading: boolean;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadFinancialData() {
      try {
        setLoading(true);
        const [revenuesData, expensesData] = await Promise.all([getRevenues(), getExpenses()]);
        setRevenues(revenuesData);
        setExpenses(expensesData);
      } catch (error) {
        console.error("Failed to load financial data:", error);
        toast({ variant: 'destructive', title: "خطأ في تحميل البيانات المالية", description: "لم نتمكن من تحميل البيانات من قاعدة البيانات." });
      } finally {
        setLoading(false);
      }
    }
    loadFinancialData();
  }, [toast]);

  const addRevenue = async (revenueData: Omit<Revenue, 'id'>) => {
    try {
        const newRevenue = await createRevenue(revenueData);
        setRevenues(prev => [newRevenue, ...prev]);
    } catch (error) {
        console.error("Failed to add revenue:", error);
        toast({ variant: 'destructive', title: "خطأ في إضافة الإيراد", description: "لم نتمكن من حفظ البيانات في قاعدة البيانات." });
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
        const newExpense = await createExpense(expenseData);
        setExpenses(prev => [newExpense, ...prev]);
    } catch (error) {
        console.error("Failed to add expense:", error);
        toast({ variant: 'destructive', title: "خطأ في إضافة المصروف", description: "لم نتمكن من حفظ البيانات في قاعدة البيانات." });
    }
  };

  return (
    <FinancialDataContext.Provider value={{ revenues, expenses, addRevenue, addExpense, loading }}>
      {children}
    </FinancialDataContext.Provider>
  );
}

export function useFinancialData() {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
}
