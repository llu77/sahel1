"use client";
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, Timestamp, query, orderBy, doc, getDoc } from 'firebase/firestore';
import type { Revenue, Expense } from '@/lib/types';

const revenuesCol = collection(db, 'revenues');
const expensesCol = collection(db, 'expenses');

// Get revenue data
export async function getRevenues(): Promise<Revenue[]> {
    const q = query(revenuesCol, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
        } as Revenue;
    });
}

// Add new revenue
export async function createRevenue(revenueData: Omit<Revenue, 'id'>): Promise<Revenue> {
    const docData = {
        ...revenueData,
        date: Timestamp.fromDate(revenueData.date),
    };
    const docRef = await addDoc(revenuesCol, docData);
    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    return { 
        id: newDoc.id, 
        ...data,
        date: (data?.date as Timestamp).toDate(),
    } as Revenue;
}

// Get expense data
export async function getExpenses(): Promise<Expense[]> {
    const q = query(expensesCol, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
        } as Expense;
    });
}

// Add new expense
export async function createExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
    const docData = {
        ...expenseData,
        date: Timestamp.fromDate(expenseData.date),
    };
    const docRef = await addDoc(expensesCol, docData);
    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    return { 
        id: newDoc.id,
        ...data,
        date: (data?.date as Timestamp).toDate(),
    } as Expense;
}
