
"use client";

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFinancialData } from '@/contexts/financial-data-context-api';
import { useRequests } from '@/contexts/requests-context';
import { TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react";


const StatCard = ({ title, value, icon: Icon, description }: { title: string; value: string; icon: React.ElementType; description?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminDashboard() {
  const { revenues, expenses } = useFinancialData();
  const { requests } = useRequests();

  const analytics = React.useMemo(() => {
    const totalRevenue = revenues.reduce((acc, r) => acc + r.totalAmount, 0);
    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpense;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;

    const branchData = revenues.reduce((acc, r) => {
        if (!acc[r.branch]) {
            acc[r.branch] = { name: `فرع ${r.branch === 'laban' ? 'لبن' : 'طويق'}`, revenue: 0, expense: 0 };
        }
        acc[r.branch].revenue += r.totalAmount;
        return acc;
    }, {} as Record<string, { name: string; revenue: number; expense: number }>);

    expenses.forEach(e => {
        if (!branchData[e.branch]) {
            branchData[e.branch] = { name: `فرع ${e.branch === 'laban' ? 'لبن' : 'طويق'}`, revenue: 0, expense: 0 };
        }
        branchData[e.branch].expense += e.amount;
    });

    const expenseByCategory = expenses.reduce((acc, e) => {
        if (!acc[e.category]) {
            acc[e.category] = 0;
        }
        acc[e.category] += e.amount;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalRevenue,
        totalExpense,
        netProfit,
        pendingRequests,
        branchPerformance: Object.values(branchData),
        expenseDistribution: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
    };
  }, [revenues, expenses, requests]);


  return (
     <>
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">نظرة عامة على الأداء</h1>
                <p className="text-muted-foreground mt-1">ملخص شامل لأداء الشركة وفروعها.</p>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard title="إجمالي الإيرادات" value={`${analytics.totalRevenue.toLocaleString()} ريال`} icon={TrendingUp} description="مجموع الإيرادات من كافة الفروع" />
            <StatCard title="إجمالي المصاريف" value={`${analytics.totalExpense.toLocaleString()} ريال`} icon={TrendingDown} description="مجموع المصاريف من كافة الفروع" />
            <StatCard title="صافي الربح" value={`${analytics.netProfit.toLocaleString()} ريال`} icon={DollarSign} description="الإيرادات ناقص المصاريف" />
            <StatCard title="طلبات قيد المراجعة" value={analytics.pendingRequests.toString()} icon={Clock} description="طلبات تحتاج إلى إجراء" />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
            <Card>
            <CardHeader>
                <CardTitle>أداء الفروع</CardTitle>
                <CardDescription>مقارنة بين الإيرادات والمصاريف لكل فرع</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.branchPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value/1000} ألف`}/>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} ريال`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#82ca9d" name="الإيرادات" />
                    <Bar dataKey="expense" fill="#ff8042" name="المصاريف" />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle>توزيع المصاريف</CardTitle>
                <CardDescription>عرض المصاريف حسب البند على مستوى الشركة</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                    data={analytics.expenseDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    >
                    {analytics.expenseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} ريال`} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
        </div>
    </>
  );
}
