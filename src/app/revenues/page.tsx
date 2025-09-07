
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datepicker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Revenue } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DollarSign, FileText, Send, AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useFinancialData } from '@/contexts/financial-data-context-api';
import { RevenueReportPrint } from '@/components/ui/revenue-report-print';

const employeesByBranch = {
    'laban': ['عبدالحي جلال', 'محمود عمارة', 'علاء ناصر', 'السيد'],
    'tuwaiq': ['محمد إسماعيل', 'محمد ناصر', 'فارس', 'السيد']
};

const revenueFormSchema = z.object({
  totalAmount: z.coerce.number().positive({ message: "يجب أن يكون المبلغ الإجمالي إيجابيًا." }),
  cashAmount: z.coerce.number().min(0, { message: "مبلغ الكاش لا يمكن أن يكون سالبًا." }),
  networkAmount: z.coerce.number().min(0, { message: "مبلغ الشبكة لا يمكن أن يكون سالبًا." }),
  employeeContributions: z.array(z.object({ 
      name: z.string().min(1, { message: "يرجى اختيار الموظف." }),
      amount: z.coerce.number().positive({ message: "يجب إدخال مبلغ إيراد صحيح." }),
    })).min(1, { message: "يجب إضافة موظف واحد على الأقل." }).max(5, { message: "لا يمكن إضافة أكثر من 5 موظفين." }),
  date: z.date({ required_error: "التاريخ مطلوب." }),
  description: z.string().optional(),
  branch: z.string({ required_error: "يرجى تحديد الفرع." }).min(1, "يرجى تحديد الفرع."),
}).superRefine((data, ctx) => {
    const round = (num: number) => Math.round(num * 100) / 100;
    const paymentSum = round((data.cashAmount || 0) + (data.networkAmount || 0));
    const totalAmount = round(data.totalAmount);
    
    if (paymentSum !== totalAmount) {
        if (!data.description || data.description.trim().length < 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["description"],
                message: "الوصف إلزامي ويجب أن لا يقل عن 10 أحرف في حالة عدم تطابق الدفع.",
            });
        }
    }
    const contributionSum = round(data.employeeContributions.reduce((acc, curr) => acc + (curr.amount || 0), 0));
    if (contributionSum !== totalAmount) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["employeeContributions"],
            message: `مجموع إيرادات الموظفين (${contributionSum}) لا يساوي المبلغ الإجمالي (${totalAmount}).`,
        });
    }
});

const StatCard = ({ title, value, icon: Icon, isMismatched = false }: { title: string; value: string; icon: React.ElementType, isMismatched?: boolean }) => (
    <Card className={isMismatched ? 'border-red-500 bg-red-50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${isMismatched ? 'text-red-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isMismatched ? 'text-red-600' : ''}`}>{value}</div>
      </CardContent>
    </Card>
);

export default function RevenuesPage() {
  const { user } = useAuth();
  const { revenues, addRevenue } = useFinancialData();
  const { toast } = useToast();
  
  const branchRevenues = React.useMemo(() => {
    if (!revenues || !Array.isArray(revenues)) return [];
    if (user?.role === 'admin') return revenues;
    return revenues.filter(r => r.branch === user?.branch);
  }, [revenues, user]);

  const form = useForm<z.infer<typeof revenueFormSchema>>({
    resolver: zodResolver(revenueFormSchema),
    defaultValues: {
      totalAmount: undefined,
      cashAmount: undefined,
      networkAmount: undefined,
      employeeContributions: [{ name: "", amount: undefined as any }],
      date: new Date(),
      description: "",
      branch: user?.role === 'admin' ? '' : user?.branch,
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "employeeContributions",
  });
  
  const selectedBranch = form.watch("branch");
  const totalAmount = form.watch("totalAmount");
  const cashAmount = form.watch("cashAmount");
  const networkAmount = form.watch("networkAmount");

  const round = (num: number | undefined) => Math.round((num || 0) * 100) / 100;
  const isPaymentMismatched = round(totalAmount) !== round(cashAmount) + round(networkAmount);
  
  useEffect(() => {
    if (user?.role !== 'admin' && user?.branch) {
      form.setValue('branch', user.branch);
    }
  }, [user, form]);
  
  useEffect(() => {
    if (selectedBranch) {
        form.setValue('employeeContributions', [{ name: "", amount: undefined as any }]);
    }
  }, [selectedBranch, form]);

  const handleAddRevenue = async (values: z.infer<typeof revenueFormSchema>) => {
    try {
      // Convert form data to match API requirements
      const newRevenueData = {
        documentNumber: `REV-${Date.now()}`, // Generate unique document number
        documentType: values.branch || 'عام',
        amount: values.totalAmount || 0,
        discount: 0,
        totalAfterDiscount: values.totalAmount || 0,
        percentage: 0,
        date: values.date ? format(values.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: `نقدي: ${values.cashAmount || 0} - شبكة: ${values.networkAmount || 0}`,
        branchRevenue: values.totalAmount || 0,
        departmentRevenue: 0,
        notes: values.description || '',
        mismatchReason: isPaymentMismatched ? values.description : '',
        employeeContributions: values.employeeContributions || [],
        branch: values.branch || 'عام'
      };
      
      await addRevenue(newRevenueData);
      
      toast({
        title: "تمت إضافة الإيراد",
        description: `تمت إضافة إيراد جديد بمبلغ ${values.totalAmount} ريال بنجاح.`,
      });
      
      form.reset({
        totalAmount: undefined,
        cashAmount: undefined,
        networkAmount: undefined,
        employeeContributions: [{ name: "", amount: undefined as any }],
        date: new Date(),
        description: "",
        branch: user?.role === 'admin' ? '' : user?.branch,
      });
    } catch (error) {
      console.error('Failed to add revenue:', error);
      toast({
        title: "خطأ في إضافة الإيراد",
        description: "حدث خطأ أثناء إضافة الإيراد. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };
  
  const totalRevenue = branchRevenues.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCash = branchRevenues.reduce((acc, curr) => acc + (curr.cashAmount || 0), 0);
  const totalNetwork = branchRevenues.reduce((acc, curr) => acc + (curr.networkAmount || 0), 0);
  const totalMismatch = Math.abs((totalCash + totalNetwork) - totalRevenue) > 0.01;

  const availableEmployees = useMemo(() => {
    const branchKey = selectedBranch as keyof typeof employeesByBranch;
    return employeesByBranch[branchKey] || [];
  }, [selectedBranch]);


  return (
    <>
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-headline font-bold">صفحة الإيرادات {user?.branch && user.branch !== 'admin' && `- فرع ${user.branch}`}</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard title="الإجمالي" value={`${totalRevenue.toLocaleString()} ريال`} icon={DollarSign} isMismatched={totalMismatch} />
          <StatCard title="الكاش" value={`${totalCash.toLocaleString()} ريال`} icon={DollarSign} />
          <StatCard title="الشبكة" value={`${totalNetwork.toLocaleString()} ريال`} icon={DollarSign} />
          <StatCard title="عدد الحركات" value={branchRevenues.length.toString()} icon={FileText} />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-3">
          <Card>
              <CardHeader>
              <CardTitle className="font-headline">إضافة إيراد جديد</CardTitle>
              <CardDescription>املأ النموذج أدناه لتسجيل إيراد جديد.</CardDescription>
              </CardHeader>
              <CardContent>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddRevenue)} className="space-y-6">
                  {user?.role === 'admin' && (
                      <FormField control={form.control} name="branch" render={({ field }) => (
                          <FormItem>
                              <FormLabel>الفرع</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="اختر الفرع للإيراد" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      <SelectItem value="laban">فرع لبن</SelectItem>
                                      <SelectItem value="tuwaiq">فرع طويق</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )} />
                  )}
                  <FormField control={form.control} name="totalAmount" render={({ field }) => (
                      <FormItem>
                      <FormLabel>المبلغ الإجمالي</FormLabel>
                      <FormControl>
                          <Input type="number" placeholder="الإجمالي بالريال" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="cashAmount" render={({ field }) => (
                      <FormItem>
                      <FormLabel>مبلغ الكاش</FormLabel>
                      <FormControl>
                          <Input type="number" placeholder="الكاش" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="networkAmount" render={({ field }) => (
                      <FormItem>
                      <FormLabel>مبلغ الشبكة</FormLabel>
                      <FormControl>
                          <Input type="number" placeholder="الشبكة" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )} />
                  </div>
                  
                  <div className="space-y-4">
                      <FormLabel>إيرادات الموظفين</FormLabel>
                      {fields.map((field, index) => (
                          <div key={field.id} className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                              <FormField
                              control={form.control}
                              name={`employeeContributions.${index}.name`}
                              render={({ field }) => (
                                  <FormItem>
                                      <Select onValueChange={field.onChange} value={field.value} disabled={!availableEmployees.length}>
                                          <FormControl>
                                          <SelectTrigger>
                                              <SelectValue placeholder={!availableEmployees.length ? "اختر فرعًا أولاً" : "اختر موظفًا"} />
                                          </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                              {availableEmployees.map(employee => (
                                                  <SelectItem key={employee} value={employee}>
                                                      {employee}
                                                  </SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              <FormField
                              control={form.control}
                              name={`employeeContributions.${index}.amount`}
                              render={({ field }) => (
                                  <FormItem>
                                      <FormControl>
                                          <Input type="number" placeholder="ايراد الموظف" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                      </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="mt-8">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                          </div>
                      ))}
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => append({ name: "", amount: undefined as any })}
                          disabled={fields.length >= 5}
                      >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          إضافة موظف
                      </Button>
                      <FormMessage>{form.formState.errors.employeeContributions?.message || (form.formState.errors.employeeContributions as any)?.root?.message}</FormMessage>
                  </div>

                  <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                      <FormLabel>تاريخ الإيراد</FormLabel>
                      <FormControl>
                          <DatePicker date={field.value} setDate={field.onChange} placeholder="اختر تاريخًا" />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                      <FormLabel className={isPaymentMismatched ? "text-red-600 flex items-center gap-1" : ""}>
                          {isPaymentMismatched && <AlertTriangle className="h-4 w-4" />}
                          الوصف / سبب عدم المطابقة
                      </FormLabel>
                      <FormControl>
                          <Textarea placeholder={isPaymentMismatched ? "يرجى توضيح سبب الاختلاف..." : "أضف وصفًا موجزًا (اختياري)..."} {...field} className={isPaymentMismatched ? "border-red-500 focus-visible:ring-red-500" : ""} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )} />
                  <Button type="submit" className="w-full font-semibold" disabled={user?.role === 'admin' && !selectedBranch}>
                      <Send className="ml-2 h-4 w-4" /> إضافة الإيراد
                  </Button>
                  </form>
              </Form>
              </CardContent>
          </Card>
          </div>
          <div className="lg:col-span-4">
              <Card>
                  <CardHeader>
                      <CardTitle className="font-headline">سجل الإيرادات</CardTitle>
                      <CardDescription>قائمة بجميع حركات الإيرادات المسجلة لفرعك.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="border rounded-md">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>التفاصيل</TableHead>
                                      <TableHead>الإجمالي</TableHead>
                                      <TableHead>طرق الدفع</TableHead>
                                      <TableHead>التاريخ</TableHead>
                                      {user?.role === 'admin' && <TableHead>الفرع</TableHead>}
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {branchRevenues.map((revenue) => (
                                      <TableRow key={revenue.id} className={revenue.mismatchReason ? 'bg-red-50/50' : ''}>
                                          <TableCell>
                                          <div className="font-medium">{revenue.description || 'لا يوجد وصف'}</div>
                                          <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                              {revenue.employeeContributions && Array.isArray(revenue.employeeContributions) && revenue.employeeContributions.map(c => (
                                                  <div key={c.name}>{c.name}: <span className="font-semibold">{c.amount?.toLocaleString() || 0} ريال</span></div>
                                              ))}
                                          </div>
                                          {revenue.mismatchReason && <p className="text-xs text-red-600 mt-1">سبب عدم المطابقة: {revenue.mismatchReason}</p>}
                                          </TableCell>
                                          <TableCell className="font-semibold">{`${(revenue.totalAmount || 0).toLocaleString()} ريال`}</TableCell>
                                          <TableCell>
                                              <div>الكاش: {`${(revenue.cashAmount || 0).toLocaleString()} ريال`}</div>
                                              <div>الشبكة: {`${(revenue.networkAmount || 0).toLocaleString()} ريال`}</div>
                                          </TableCell>
                                          <TableCell>{revenue.date ? format(new Date(revenue.date), 'PPP', { locale: ar }) : 'غير محدد'}</TableCell>
                                          {user?.role === 'admin' && <TableCell>{revenue.branch === 'laban' ? 'لبن' : 'طويق'}</TableCell>}
                                          </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </CardContent>
              </Card>
              
              {/* Revenue Report Print Section */}
              <div className="mt-6">
                  <RevenueReportPrint
                      revenues={branchRevenues.map(rev => ({
                          id: rev.id,
                          documentNumber: `REV-${rev.id.toString().padStart(6, '0')}`,
                          documentType: 'إيراد',
                          amount: rev.totalAmount || 0,
                          discount: 0,
                          totalAfterDiscount: rev.totalAmount || 0,
                          percentage: 100,
                          date: rev.date || new Date(),
                          paymentMethod: `نقدي: ${(rev.cashAmount || 0).toLocaleString()} - شبكة: ${(rev.networkAmount || 0).toLocaleString()}`,
                          branchRevenue: rev.totalAmount || 0,
                          departmentRevenue: 0,
                          notes: rev.description,
                          employeeContributions: rev.employeeContributions,
                          branch: rev.branch
                      }))}
                      branch={selectedBranch || user?.branch || 'laban'}
                      title="تقرير الإيرادات"
                      showPrintButton={true}
                  />
              </div>
          </div>
      </div>
    </>
  );
}
