'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { transformRevenue, parseEmployeeContributions } from '@/lib/revenue-transformer';

// Types
interface Revenue {
  id?: string | number;
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

interface Expense {
  id?: string | number;
  amount: number;
  date: string;
  reason: string;
  type: string;
  category: string;
  details?: string;
}

interface DailyClosing {
  id?: string | number;
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  branchRevenue: number;
  departmentRevenue: number;
  notes?: string;
}

interface FinancialDataContextType {
  revenues: Revenue[];
  expenses: Expense[];
  dailyClosing: DailyClosing | null;
  addRevenue: (revenue: Omit<Revenue, 'id'>) => Promise<void>;
  updateRevenue: (id: string | number, revenue: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string | number) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string | number, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string | number) => Promise<void>;
  calculateDailyClosing: (date: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: React.ReactNode }) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailyClosing, setDailyClosing] = useState<DailyClosing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch revenues
  const fetchRevenues = async (date?: string) => {
    try {
      const url = date ? `/api/revenues?date=${date}` : '/api/revenues';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch revenues');
      const data = await response.json();
      
      // Transform API data to match component expectations
      const transformedData = data.map((item: any) => transformRevenue(item));
      
      setRevenues(transformedData);
    } catch (error) {
      console.error('Error fetching revenues:', error);
      setError('Failed to fetch revenues');
    }
  };

  // Fetch expenses
  const fetchExpenses = async (date?: string) => {
    try {
      const url = date ? `/api/expenses?date=${date}` : '/api/expenses';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to fetch expenses');
    }
  };

  // Fetch daily closing
  const fetchDailyClosing = async (date: string) => {
    try {
      const response = await fetch(`/api/daily-closings?date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch daily closing');
      const data = await response.json();
      setDailyClosing(data);
    } catch (error) {
      console.error('Error fetching daily closing:', error);
      setError('Failed to fetch daily closing');
    }
  };

  // Add revenue
  const addRevenue = async (revenue: Omit<Revenue, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      // Clean up undefined values
      const cleanRevenue = {
        documentNumber: revenue.documentNumber || '',
        documentType: revenue.documentType || '',
        amount: revenue.amount || 0,
        discount: revenue.discount || 0,
        totalAfterDiscount: revenue.totalAfterDiscount || revenue.amount || 0,
        percentage: revenue.percentage || 0,
        date: revenue.date || format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: revenue.paymentMethod || '',
        branchRevenue: revenue.branchRevenue || 0,
        departmentRevenue: revenue.departmentRevenue || 0,
        notes: revenue.notes || '',
        mismatchReason: revenue.mismatchReason || ''
      };

      const response = await fetch('/api/revenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanRevenue),
      });
      
      if (!response.ok) throw new Error('Failed to add revenue');
      const newRevenue = await response.json();
      setRevenues(prev => [...prev, newRevenue]);
      // Refresh all revenues to ensure consistency
      await fetchRevenues();
    } catch (error) {
      console.error('Error adding revenue:', error);
      setError('Failed to add revenue');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update revenue
  const updateRevenue = async (id: string | number, revenue: Partial<Revenue>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/revenues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...revenue }),
      });
      
      if (!response.ok) throw new Error('Failed to update revenue');
      const updatedRevenue = await response.json();
      setRevenues(prev => prev.map(r => r.id === id ? updatedRevenue : r));
    } catch (error) {
      console.error('Error updating revenue:', error);
      setError('Failed to update revenue');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete revenue
  const deleteRevenue = async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/revenues?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete revenue');
      setRevenues(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting revenue:', error);
      setError('Failed to delete revenue');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add expense
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });
      
      if (!response.ok) throw new Error('Failed to add expense');
      const newExpense = await response.json();
      setExpenses(prev => [...prev, newExpense]);
      // Refresh all expenses to ensure consistency
      await fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      setError('Failed to add expense');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update expense
  const updateExpense = async (id: string | number, expense: Partial<Expense>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...expense }),
      });
      
      if (!response.ok) throw new Error('Failed to update expense');
      const updatedExpense = await response.json();
      setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
    } catch (error) {
      console.error('Error updating expense:', error);
      setError('Failed to update expense');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete expense
  const deleteExpense = async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete expense');
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Calculate daily closing
  const calculateDailyClosing = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      await fetchRevenues(date);
      await fetchExpenses(date);
      
      const dayRevenues = revenues.filter(r => r.date === date);
      const dayExpenses = expenses.filter(e => e.date === date);
      
      const totalRevenue = dayRevenues.reduce((sum, r) => sum + (r.totalAfterDiscount || 0), 0);
      const totalExpenses = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const branchRevenue = dayRevenues.reduce((sum, r) => sum + (r.branchRevenue || 0), 0);
      const departmentRevenue = dayRevenues.reduce((sum, r) => sum + (r.departmentRevenue || 0), 0);
      
      const closing: DailyClosing = {
        date,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        branchRevenue,
        departmentRevenue,
        notes: ''
      };
      
      const response = await fetch('/api/daily-closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closing),
      });
      
      if (!response.ok) throw new Error('Failed to save daily closing');
      const savedClosing = await response.json();
      setDailyClosing(savedClosing);
    } catch (error) {
      console.error('Error calculating daily closing:', error);
      setError('Failed to calculate daily closing');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Load initial data and set up auto-refresh
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Initial load
    const loadData = () => {
      fetchRevenues();
      fetchExpenses();
      fetchDailyClosing(today);
    };
    
    loadData();
    
    // Refresh data every 5 seconds for real-time sync
    const interval = setInterval(loadData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <FinancialDataContext.Provider
      value={{
        revenues,
        expenses,
        dailyClosing,
        addRevenue,
        updateRevenue,
        deleteRevenue,
        addExpense,
        updateExpense,
        deleteExpense,
        calculateDailyClosing,
        loading,
        error,
      }}
    >
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