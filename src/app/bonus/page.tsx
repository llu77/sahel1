
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMonth, getYear, getDaysInMonth, startOfMonth } from 'date-fns';
import { useFinancialData } from '@/contexts/financial-data-context-api';
import { useAuth } from '@/contexts/auth-context';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getBonusRules } from '@/services/bonus-local';
import type { BonusRule } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";


const employeesByBranch = {
    'laban': ['عبدالحي جلال', 'محمود عمارة', 'علاء ناصر', 'السيد'],
    'tuwaiq': ['محمد إسماعيل', 'محمد ناصر', 'فارس', 'السيد']
};

export default function BonusPage() {
    const { user } = useAuth();
    const { revenues } = useFinancialData();
    const { toast } = useToast();
    const [selectedBranch, setSelectedBranch] = useState<'laban' | 'tuwaiq' | ''>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [bonusRules, setBonusRules] = useState<BonusRule[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);

    const fetchRules = useCallback(async (branch: 'laban' | 'tuwaiq') => {
        try {
            setLoadingRules(true);
            const rules = await getBonusRules(branch);
            setBonusRules(rules);
        } catch (error) {
            toast({ variant: 'destructive', title: 'فشل تحميل قواعد البونص' });
        } finally {
            setLoadingRules(false);
        }
    }, [toast]);
    
    useEffect(() => {
        if (selectedBranch) {
            fetchRules(selectedBranch);
        }
    }, [selectedBranch, fetchRules]);


    const calculateBonus = useMemo(() => {
        // Bonus rules are sorted descending by threshold from Firestore
        return (weeklyIncome: number) => {
            for (const rule of bonusRules) {
                if (weeklyIncome >= rule.weeklyIncomeThreshold) {
                    return rule.bonusAmount;
                }
            }
            return 0;
        };
    }, [bonusRules]);

    const bonusData = useMemo(() => {
        if (!selectedBranch || loadingRules) return [];

        // Filter revenues by branch (documentType holds branch info)
        const branchRevenues = revenues?.filter(r => 
            r.documentType === selectedBranch || r.branch === selectedBranch
        ) || [];
        
        const employees = employeesByBranch[selectedBranch];
        const currentYear = new Date().getFullYear();

        return employees.map(employeeName => {
            const employeeIncomesByDay: Record<string, number> = {};

            branchRevenues.forEach(revenue => {
                // Parse date properly
                const revenueDate = typeof revenue.date === 'string' 
                    ? new Date(revenue.date) 
                    : revenue.date;
                    
                if (getYear(revenueDate) !== currentYear || getMonth(revenueDate) !== selectedMonth) return;
                
                // Check if employee has contributions
                const contributions = revenue.employeeContributions || [];
                const contribution = Array.isArray(contributions) 
                    ? contributions.find((c: any) => c.name === employeeName)
                    : null;
                    
                if (contribution && contribution.amount) {
                    const dayKey = revenueDate.getDate();
                    if (!employeeIncomesByDay[dayKey]) {
                        employeeIncomesByDay[dayKey] = 0;
                    }
                    employeeIncomesByDay[dayKey] += contribution.amount;
                }
            });

            const monthStartDate = startOfMonth(new Date(currentYear, selectedMonth));
            const daysInMonth = getDaysInMonth(monthStartDate);

            const monthlyData = [];

            // Calculate for the 4 full weeks
            for (let week = 0; week < 4; week++) {
                let weekIncome = 0;
                const startDay = week * 7 + 1;
                const endDay = startDay + 6;
                for (let day = startDay; day <= endDay; day++) {
                    weekIncome += employeeIncomesByDay[day] || 0;
                }
                const bonus = calculateBonus(weekIncome);
                monthlyData.push({
                    period: `الأسبوع ${week + 1}`,
                    days: `${startDay} - ${endDay}`,
                    income: weekIncome,
                    bonus,
                });
            }

            // Calculate for remaining days
            const remainingDaysStart = 29;
            if (daysInMonth >= remainingDaysStart) {
                let remainingIncome = 0;
                for (let day = remainingDaysStart; day <= daysInMonth; day++) {
                    remainingIncome += employeeIncomesByDay[day] || 0;
                }
                
                let proratedBonus = 0;
                // Prorate bonus based on the income of the remaining days
                if (remainingIncome > 0) {
                  // Find which bonus tier the remaining income falls into
                  const weeklyEquivalentIncome = (remainingIncome / (daysInMonth - remainingDaysStart + 1)) * 7;
                  const applicableBonusTier = calculateBonus(weeklyEquivalentIncome);
                  // Prorate the bonus for the number of remaining days
                  proratedBonus = (applicableBonusTier / 7) * (daysInMonth - remainingDaysStart + 1);
                }

                monthlyData.push({
                    period: 'الأيام المتبقية',
                    days: `${remainingDaysStart} - ${daysInMonth}`,
                    income: remainingIncome,
                    bonus: Math.round(proratedBonus),
                });
            }


            return {
                id: employeeName,
                name: employeeName,
                monthlyData,
                totalBonus: monthlyData.reduce((acc, data) => acc + data.bonus, 0),
            };
        });

    }, [revenues, selectedBranch, selectedMonth, loadingRules, calculateBonus]);

    const isAdmin = user?.role === 'admin';
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];


    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-headline font-bold mb-2">صفحة البونص</h1>
                    <p className="text-muted-foreground">عرض البونص الشهري للموظفين بناءً على الإيرادات.</p>
                </div>
            </div>


            {isAdmin && (
                <Card className="mb-8 max-w-md">
                    <CardHeader>
                        <CardTitle>اختر الفرع والشهر</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Select onValueChange={(value: 'laban' | 'tuwaiq') => setSelectedBranch(value)} value={selectedBranch}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الفرع" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="laban">فرع لبن</SelectItem>
                                <SelectItem value="tuwaiq">فرع طويق</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => setSelectedMonth(Number(value))} value={String(selectedMonth)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الشهر" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthNames.map((month, index) => (
                                    <SelectItem key={index} value={String(index)}>{month}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}
            
            {selectedBranch && (
                <div className="grid gap-8 lg:grid-cols-2">
                    {bonusData.map(employee => (
                        employee.monthlyData.some(d => d.income > 0) && (
                            <Card key={employee.id}>
                                <CardHeader>
                                    <CardTitle className="font-headline flex items-center justify-between">
                                        <div className="flex items-center gap-2"><Award className="text-primary"/> {employee.name}</div>
                                        <Badge variant="secondary" className="text-base">{employee.totalBonus.toLocaleString()} ريال</Badge>
                                    </CardTitle>
                                    <CardDescription>البونص لشهر {monthNames[selectedMonth]} {new Date().getFullYear()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>الفترة</TableHead>
                                                <TableHead>الأيام</TableHead>
                                                <TableHead>مجموع الدخل</TableHead>
                                                <TableHead className="text-primary font-semibold">حالة الاستحقاق</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employee.monthlyData.map(data => (
                                                (data.income > 0) &&
                                                <TableRow key={data.period}>
                                                    <TableCell>{data.period}</TableCell>
                                                    <TableCell>{data.days}</TableCell>
                                                    <TableCell>{data.income.toLocaleString()} ريال</TableCell>
                                                    <TableCell>
                                                        {data.bonus > 0 ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                                                <CheckCircle className="ml-1 h-3 w-3" />
                                                                مستحق ({data.bonus.toLocaleString()} ريال)
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                                                                <XCircle className="ml-1 h-3 w-3" />
                                                                غير مستحق
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )
                    ))}
                </div>
            )}

            {!selectedBranch && isAdmin && (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg mt-8">
                    <Award className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">الرجاء تحديد فرع وشهر</h3>
                    <p className="text-muted-foreground">اختر فرعًا وشهرًا من القوائم أعلاه لبدء عرض بيانات البونص للموظفين.</p>
                </div>
            )}
        </>
    );
}
