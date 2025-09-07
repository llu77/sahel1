
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/datepicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DollarSign, TrendingUp, TrendingDown, Filter, ArrowUpCircle, ArrowDownCircle, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useFinancialData } from '@/contexts/financial-data-context-api';
import { subMonths } from 'date-fns';
import { useRouter } from 'next/navigation';
import PrintWrapper from '@/components/ui/print-wrapper';
import { ReportsPrint } from '@/components/ui/reports-print';

const StatCard = ({ title, value, icon: Icon, description, color }: { title: string; value: string; icon: React.ElementType, description?: string, color?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ''}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
);

export default function ReportsPage() {
  const { user } = useAuth();
  const { revenues, expenses, loading } = useFinancialData();
  const router = useRouter();

  const [selectedBranch, setSelectedBranch] = useState<'all' | 'laban' | 'tuwaiq'>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);
  
  const filteredData = useMemo(() => {
      const { from, to } = dateRange;
      if (!from || !to) return { filteredRevenues: [], filteredExpenses: [] };

      const filterLogic = (item: {date: Date, branch: string}) => 
        (selectedBranch === 'all' || item.branch === selectedBranch) &&
        item.date >= from && item.date <= to;
    
      const filteredRevenues = revenues.filter(filterLogic);
      const filteredExpenses = expenses.filter(filterLogic);

      return { filteredRevenues, filteredExpenses };
  }, [revenues, expenses, selectedBranch, dateRange]);

 const financialSummary = useMemo(() => {
    const totalRevenue = filteredData.filteredRevenues.reduce((acc, r) => acc + r.totalAmount, 0);
    const totalExpense = filteredData.filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpense;

    const dailyIncomes: Record<string, number> = filteredData.filteredRevenues.reduce((acc, r) => {
        const day = format(r.date, 'yyyy-MM-dd');
        if (!acc[day]) acc[day] = 0;
        acc[day] += r.totalAmount;
        return acc;
    }, {} as Record<string, number>);

    const incomeValues = Object.values(dailyIncomes);
    const highestDailyIncome = incomeValues.length ? Math.max(...incomeValues) : 0;
    const lowestDailyIncomeValue = incomeValues.length > 0 ? Math.min(...incomeValues) : 0;
    const lowestDailyIncome = isFinite(lowestDailyIncomeValue) ? lowestDailyIncomeValue : 0;
    const daysWithIncome = incomeValues.length;
    const dailyAverageIncome = daysWithIncome > 0 ? totalRevenue / daysWithIncome : 0;

    const employeePerformance: Record<string, number> = filteredData.filteredRevenues.flatMap(r => r.employeeContributions).reduce((acc, c) => {
        if (!acc[c.name]) acc[c.name] = 0;
        acc[c.name] += c.amount;
        return acc;
    }, {} as Record<string, number>);
    
    const employees = Object.entries(employeePerformance);
    const topEmployee = employees.length ? employees.reduce((max, emp) => emp[1] > max[1] ? emp : max, ["-", 0]) : ["-", 0];

    const { from, to } = dateRange;
    if(!from || !to) return { totalRevenue, totalExpense, netProfit, highestDailyIncome, lowestDailyIncome, dailyAverageIncome, topEmployee: { name: topEmployee[0], amount: topEmployee[1] }, profitComparisonPercentage: 0 };


    const prevMonthFrom = subMonths(from, 1);
    const prevMonthTo = subMonths(to, 1);

    const prevMonthRevenues = revenues.filter(r => 
        (selectedBranch === 'all' || r.branch === selectedBranch) &&
        r.date >= prevMonthFrom && r.date <= prevMonthTo
    );
    const prevMonthExpenses = expenses.filter(e => 
        (selectedBranch === 'all' || e.branch === selectedBranch) &&
        e.date >= prevMonthFrom && e.date <= prevMonthTo
    );
    const prevMonthNetProfit = prevMonthRevenues.reduce((acc, r) => acc + r.totalAmount, 0) - prevMonthExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    let profitComparisonPercentage = 0;
    if (prevMonthNetProfit !== 0) {
      profitComparisonPercentage = ((netProfit - prevMonthNetProfit) / Math.abs(prevMonthNetProfit)) * 100;
    } else if (netProfit > 0) {
      profitComparisonPercentage = 100;
    }
    
    return {
        totalRevenue,
        totalExpense,
        netProfit,
        highestDailyIncome,
        lowestDailyIncome,
        dailyAverageIncome,
        topEmployee: { name: topEmployee[0], amount: topEmployee[1] },
        profitComparisonPercentage,
    };
}, [filteredData, revenues, expenses, selectedBranch, dateRange]);
  
  if (user?.role !== 'admin') {
      return null;
  }

  const branchName = selectedBranch === 'all' ? 'جميع الفروع' : selectedBranch === 'laban' ? 'لبن' : 'طويق';

  return (
    <PrintWrapper
      title="التقارير المالية"
      subtitle={`تقرير مفصل للفترة المحددة`}
      branch={branchName}
      dateRange={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
      showPrintButton={true}
      buttonText="طباعة التقرير"
    >
        <div className="flex items-center justify-between mb-6 no-print">
          <div>
            <h1 className="text-3xl font-headline font-bold">التقارير المالية المتقدمة</h1>
            <p className="text-muted-foreground mt-1">عرض وتحليل البيانات المالية بناءً على الفترة والفرع المحددين.</p>
          </div>
        </div>
        
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Filter/> خيارات الفلترة</CardTitle>
                 <CardDescription>اختر الفرع والفترة الزمنية لعرض التقرير.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
                <Select onValueChange={(value: 'all' | 'laban' | 'tuwaiq') => setSelectedBranch(value)} value={selectedBranch}>
                    <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">كل الفروع</SelectItem>
                        <SelectItem value="laban">فرع لبن</SelectItem>
                        <SelectItem value="tuwaiq">فرع طويق</SelectItem>
                    </SelectContent>
                </Select>
                <DatePicker date={dateRange.from} setDate={(date) => date && setDateRange(prev => ({ ...prev, from: date }))} placeholder="من تاريخ" />
                <DatePicker date={dateRange.to} setDate={(date) => date && setDateRange(prev => ({ ...prev, to: date }))} placeholder="إلى تاريخ" />
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard title="إجمالي الإيرادات" value={`${financialSummary.totalRevenue.toLocaleString()} ريال`} icon={TrendingUp} />
            <StatCard title="إجمالي المصاريف" value={`${financialSummary.totalExpense.toLocaleString()} ريال`} icon={TrendingDown} />
            <StatCard title="صافي الربح" value={`${financialSummary.netProfit.toLocaleString()} ريال`} icon={DollarSign} color={financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
            <StatCard 
                title="مقارنة بالشهر السابق" 
                value={`${financialSummary.profitComparisonPercentage.toFixed(1)}%`} 
                icon={financialSummary.profitComparisonPercentage >= 0 ? ArrowUpCircle : ArrowDownCircle} 
                color={financialSummary.profitComparisonPercentage >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <StatCard title="متوسط الدخل اليومي" value={`${financialSummary.dailyAverageIncome.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`} icon={Calendar} />
            <StatCard title="أعلى دخل يومي" value={`${financialSummary.highestDailyIncome.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`} icon={TrendingUp} />
            <StatCard title="أقل دخل يومي" value={`${financialSummary.lowestDailyIncome.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`} icon={TrendingDown} />
            <StatCard title="أعلى موظف إيرادًا" value={financialSummary.topEmployee.name} description={`${financialSummary.topEmployee.amount.toLocaleString()} ريال`} icon={UserCheck} />

        </div>

        <div className="grid gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>تفاصيل الإيرادات</CardTitle>
                    <CardDescription>جميع حركات الإيراد للفترة المحددة</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>المبلغ</TableHead><TableHead>الفرع</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredData.filteredRevenues.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{format(r.date, 'PPP', { locale: ar })}</TableCell>
                                    <TableCell className="font-semibold">{r.totalAmount.toLocaleString()} ريال</TableCell>
                                    <TableCell>{r.branch === 'laban' ? 'لبن' : 'طويق'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>تفاصيل المصاريف</CardTitle>
                    <CardDescription>جميع حركات المصروف للفترة المحددة</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>المبلغ</TableHead><TableHead>البند</TableHead><TableHead>الفرع</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredData.filteredExpenses.map(e => (
                                <TableRow key={e.id}>
                                    <TableCell>{format(e.date, 'PPP', { locale: ar })}</TableCell>
                                    <TableCell className="font-semibold">{e.amount.toLocaleString()} ريال</TableCell>
                                    <TableCell>{e.category}</TableCell>
                                    <TableCell>{e.branch === 'laban' ? 'لبن' : 'طويق'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        
        {/* Advanced Reports Print Section */}
        <div className="mt-8">
            <ReportsPrint
                revenues={financialSummary.totalRevenue}
                expenses={financialSummary.totalExpense}
                netIncome={financialSummary.netProfit}
                branch={branchName}
                dateRange={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                showPrintButton={true}
                title="تقرير إحصائي شامل"
                expensesByCategory={filteredData.filteredExpenses.reduce((acc, exp) => {
                    if (!acc[exp.category]) acc[exp.category] = 0;
                    acc[exp.category] += exp.amount;
                    return acc;
                }, {} as Record<string, number>)}
                revenuesByCategory={filteredData.filteredRevenues.reduce((acc, rev) => {
                    const category = rev.description || 'إيرادات عامة';
                    if (!acc[category]) acc[category] = 0;
                    acc[category] += rev.totalAmount;
                    return acc;
                }, {} as Record<string, number>)}
            />
        </div>
    </PrintWrapper>
  );
}
