"use client";
import type { BonusRule } from '@/lib/types';

// API endpoints for bonus rules
const API_BASE = '/api/bonus-rules';

export async function getBonusRules(branch: 'laban' | 'tuwaiq'): Promise<BonusRule[]> {
    try {
        const response = await fetch(`${API_BASE}?branch=${branch}`);
        if (!response.ok) throw new Error('Failed to fetch bonus rules');
        return await response.json();
    } catch (error) {
        console.error('Error fetching bonus rules:', error);
        // Return default rules if API fails
        return getDefaultRules(branch);
    }
}

export async function createBonusRule(rule: Omit<BonusRule, 'id'>): Promise<BonusRule> {
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rule)
        });
        if (!response.ok) throw new Error('Failed to create bonus rule');
        return await response.json();
    } catch (error) {
        console.error('Error creating bonus rule:', error);
        throw error;
    }
}

export async function updateBonusRule(ruleId: string, updates: Partial<Omit<BonusRule, 'id'>>): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/${ruleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update bonus rule');
    } catch (error) {
        console.error('Error updating bonus rule:', error);
        throw error;
    }
}

export async function deleteBonusRule(ruleId: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/${ruleId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete bonus rule');
    } catch (error) {
        console.error('Error deleting bonus rule:', error);
        throw error;
    }
}

// Default rules for each branch
function getDefaultRules(branch: 'laban' | 'tuwaiq'): BonusRule[] {
    const baseRules = [
        { weeklyIncomeThreshold: 50000, bonusAmount: 1000 },
        { weeklyIncomeThreshold: 40000, bonusAmount: 800 },
        { weeklyIncomeThreshold: 30000, bonusAmount: 600 },
        { weeklyIncomeThreshold: 20000, bonusAmount: 400 },
        { weeklyIncomeThreshold: 10000, bonusAmount: 200 },
        { weeklyIncomeThreshold: 0, bonusAmount: 0 }
    ];
    
    return baseRules.map((rule, index) => ({
        id: `default-${branch}-${index}`,
        branch,
        ...rule
    }));
}