"use client";
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import type { BonusRule } from '@/lib/types';

const bonusRulesCol = collection(db, 'bonusRules');

export async function getBonusRules(branch: 'laban' | 'tuwaiq'): Promise<BonusRule[]> {
    const q = query(bonusRulesCol, where('branch', '==', branch), orderBy('weeklyIncomeThreshold', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BonusRule));
}

export async function createBonusRule(rule: Omit<BonusRule, 'id'>): Promise<BonusRule> {
    const docRef = await addDoc(bonusRulesCol, rule);
    return { ...rule, id: docRef.id };
}

export async function updateBonusRule(ruleId: string, updates: Partial<Omit<BonusRule, 'id'>>): Promise<void> {
    const ruleRef = doc(db, 'bonusRules', ruleId);
    await updateDoc(ruleRef, updates);
}

export async function deleteBonusRule(ruleId: string): Promise<void> {
    const ruleRef = doc(db, 'bonusRules', ruleId);
    await deleteDoc(ruleRef);
}
