
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { BonusRule } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { getBonusRules, createBonusRule, updateBonusRule, deleteBonusRule } from '@/services/bonus-local';
import { Edit, Trash2, Loader2, ListOrdered } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const bonusRuleSchema = z.object({
  weeklyIncomeThreshold: z.coerce.number().min(0, "حد الدخل يجب أن يكون إيجابيًا."),
  bonusAmount: z.coerce.number().positive("مبلغ البونص يجب أن يكون إيجابيًا."),
  branch: z.enum(['laban', 'tuwaiq']),
});


export default function BonusRulesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [rules, setRules] = useState<BonusRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRule, setEditingRule] = useState<BonusRule | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<'laban' | 'tuwaiq' | ''>('');
    const { toast } = useToast();

    const form = useForm<z.infer<typeof bonusRuleSchema>>({
        resolver: zodResolver(bonusRuleSchema),
        defaultValues: { weeklyIncomeThreshold: undefined, bonusAmount: undefined },
    });
    
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/');
        }
    }, [user, router]);
    
    const fetchRules = useCallback(async (branch: 'laban' | 'tuwaiq') => {
        try {
            setLoading(true);
            const bonusRules = await getBonusRules(branch);
            setRules(bonusRules);
        } catch (error) {
            toast({ variant: 'destructive', title: 'فشل تحميل القواعد', description: 'حدث خطأ أثناء تحميل قواعد البونص.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        if (selectedBranch) {
            fetchRules(selectedBranch);
            form.setValue('branch', selectedBranch);
        } else {
            setRules([]);
        }
    }, [selectedBranch, fetchRules, form]);

    const handleFormSubmit = async (values: z.infer<typeof bonusRuleSchema>) => {
        if (!selectedBranch) return;
        setIsSubmitting(true);
        try {
            if (editingRule) {
                await updateBonusRule(editingRule.id, values);
                toast({ title: 'تم تحديث القاعدة بنجاح', description: `تم تحديث قاعدة البونص لفرع ${selectedBranch === 'laban' ? 'لبن' : 'طويق'}.` });
            } else {
                await createBonusRule(values);
                toast({ title: 'تم إنشاء القاعدة بنجاح', description: `تم إنشاء قاعدة بونص جديدة لفرع ${selectedBranch === 'laban' ? 'لبن' : 'طويق'}.` });
            }
            await fetchRules(selectedBranch);
            handleCancelEdit();
        } catch (error) {
            toast({ variant: 'destructive', title: 'فشل حفظ القاعدة' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (rule: BonusRule) => {
        setEditingRule(rule);
        form.reset(rule);
    };

    const handleCancelEdit = () => {
        setEditingRule(null);
        form.reset({ weeklyIncomeThreshold: undefined, bonusAmount: undefined, branch: selectedBranch as 'laban' | 'tuwaiq' });
    };

    const handleDelete = async (ruleId: string) => {
        if (!selectedBranch) return;
        try {
            await deleteBonusRule(ruleId);
            toast({ title: 'تم حذف القاعدة بنجاح' });
            await fetchRules(selectedBranch);
        } catch (error) {
            toast({ variant: 'destructive', title: 'فشل حذف القاعدة' });
        }
    };

    if (user?.role !== 'admin') return null;

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-headline font-bold mb-2">إدارة قواعد البونص</h1>
                    <p className="text-muted-foreground">تحكم في شرائح البونص لكل فرع بناءً على الإيرادات الأسبوعية للموظفين.</p>
                </div>
            </div>

            <Card className="mb-8 max-w-sm">
                <CardHeader>
                    <CardTitle>اختر الفرع</CardTitle>
                    <CardDescription>اختر الفرع الذي تريد إدارة قواعد البونص الخاصة به.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={(value: 'laban' | 'tuwaiq') => setSelectedBranch(value)} value={selectedBranch}>
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الفرع" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="laban">فرع لبن</SelectItem>
                            <SelectItem value="tuwaiq">فرع طويق</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
            
            {selectedBranch && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                    <div className="lg:col-span-3">
                        <Card>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                                    <CardHeader>
                                        <CardTitle className="font-headline">{editingRule ? 'تعديل قاعدة' : 'إضافة قاعدة جديدة'}</CardTitle>
                                        <CardDescription>املأ النموذج أدناه لحفظ القاعدة لفرع {selectedBranch === 'laban' ? 'لبن' : 'طويق'}.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <FormField control={form.control} name="weeklyIncomeThreshold" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>إذا تجاوز الدخل الأسبوعي (ريال)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="مثال: 3000" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="bonusAmount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>يستحق بونص (ريال)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="مثال: 280" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2">
                                        {editingRule && <Button type="button" variant="outline" onClick={handleCancelEdit}>إلغاء</Button>}
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                            {editingRule ? 'حفظ التعديلات' : 'إضافة القاعدة'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </Card>
                    </div>
                    <div className="lg:col-span-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">القواعد الحالية لفرع {selectedBranch === 'laban' ? 'لبن' : 'طويق'}</CardTitle>
                                <CardDescription>قائمة بشرائح البونص مرتبة من الأعلى إلى الأدنى.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>حد الدخل الأسبوعي</TableHead>
                                                <TableHead>مبلغ البونص المستحق</TableHead>
                                                <TableHead className="text-left">إجراءات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={3} className="h-24 text-center">جاري تحميل القواعد...</TableCell></TableRow>
                                            ) : rules.length > 0 ? rules.map((rule) => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="font-semibold">{rule.weeklyIncomeThreshold.toLocaleString()} ريال</TableCell>
                                                    <TableCell className="font-semibold text-primary">{rule.bonusAmount.toLocaleString()} ريال</TableCell>
                                                    <TableCell className="text-left">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(rule)}><Edit className="h-4 w-4" /></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        هذا الإجراء سيحذف القاعدة بشكل نهائي ولا يمكن التراجع عنه.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(rule.id)} className="bg-destructive hover:bg-destructive/90">نعم، حذف</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={3} className="h-24 text-center">لا توجد قواعد حاليًا لهذا الفرع.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
            {!selectedBranch && (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg mt-8">
                    <ListOrdered className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">الرجاء تحديد فرع</h3>
                    <p className="text-muted-foreground">اختر فرعًا من القائمة أعلاه لبدء إدارة قواعد البونص.</p>
                </div>
            )}
        </>
    );
}
