"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/datepicker";
import { AITooltip } from "@/components/ai-tooltip";
import type { SahlRequest, RequestType } from "@/lib/types";
import { CalendarDays, CircleDollarSign, Clock, LogOut, Send } from "lucide-react";
import React from "react";
import { useSearchParams } from "next/navigation";

const requestTypeOptions = [
  { value: 'leave', label: 'إجازة', icon: <CalendarDays className="ml-2 h-4 w-4" /> },
  { value: 'advance', label: 'سلفة', icon: <CircleDollarSign className="ml-2 h-4 w-4" /> },
  { value: 'resignation', label: 'استقالة', icon: <LogOut className="ml-2 h-4 w-4" /> },
  { value: 'overtime', label: 'عمل إضافي', icon: <Clock className="ml-2 h-4 w-4" /> },
] as const;

export function RequestForm({ onSubmit }: { onSubmit: (data: Omit<SahlRequest, 'id' | 'submittedAt' | 'status'>) => void }) {
  
  const [requestType, setRequestType] = React.useState<RequestType>('leave');
  const searchParams = useSearchParams();

  const formSchema = React.useMemo(() => {
    const baseSchema = z.object({
      type: z.enum(['leave', 'advance', 'resignation', 'overtime']),
      reason: z.string().min(10, { message: "يرجى تقديم سبب لا يقل عن 10 أحرف." }).max(500),
    });

    const leaveFields = z.object({
        startDate: z.date({ required_error: "تاريخ البدء مطلوب." }),
        endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب." }),
    });

    const advanceFields = z.object({
        amount: z.coerce.number().positive({ message: "يجب أن يكون المبلغ إيجابيًا." }),
    });

    const resignationFields = z.object({
        lastWorkingDay: z.date({ required_error: "آخر يوم عمل مطلوب." }),
    });
    
    const overtimeFields = z.object({
        date: z.date({ required_error: "التاريخ مطلوب." }),
        hours: z.coerce.number().min(0.5, { message: "الحد الأدنى للعمل الإضافي هو 0.5 ساعة." }).max(8, { message: "الحد الأقصى للعمل الإضافي هو 8 ساعات." }),
    });
    
    let finalSchema: z.ZodType<any, any, any>;
    switch(requestType) {
        case 'leave':
            finalSchema = baseSchema.merge(leaveFields);
            break;
        case 'advance':
            finalSchema = baseSchema.merge(advanceFields);
            break;
        case 'resignation':
            finalSchema = baseSchema.merge(resignationFields);
            break;
        case 'overtime':
            finalSchema = baseSchema.merge(overtimeFields);
            break;
        default:
            finalSchema = baseSchema;
    }
    
    return finalSchema.superRefine((data, ctx) => {
        if(data.type === 'leave' && data.startDate && data.endDate) {
            if (data.endDate < data.startDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء.",
                    path: ["endDate"],
                });
            }
        }
    });

  }, [requestType]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: requestType,
      reason: "",
    },
  });

  React.useEffect(() => {
    const t = (searchParams.get('type') || '') as RequestType;
    const allowed: RequestType[] = ['leave','advance','resignation','overtime'];
    if (t && allowed.includes(t) && t !== requestType) {
      setRequestType(t);
      const reason = form.getValues('reason');
      form.reset({ reason, type: t } as any);
    }
  }, [searchParams, requestType, form]);

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values as any);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">تقديم طلب جديد</CardTitle>
        <CardDescription>املأ النموذج أدناه لتقديم طلبك للمراجعة.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الطلب</FormLabel>
                  <Select onValueChange={(value: RequestType) => {
                    setRequestType(value);
                    const reason = form.getValues('reason');
                    form.reset({ reason, type: value } as any);
                    field.onChange(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الطلب" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {requestTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center">{opt.icon} {opt.label}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requestType === 'leave' && (
              <>
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">تاريخ البدء <AITooltip field="startDate" requestType="leave" /></FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} setDate={field.onChange} placeholder="اختر تاريخًا" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الانتهاء</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} setDate={field.onChange} disabled={(date) => date < (form.getValues('startDate') || new Date())} placeholder="اختر تاريخًا" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {requestType === 'advance' && (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">المبلغ <AITooltip field="amount" requestType="advance" /></FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="مثال: 500" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {requestType === 'resignation' && (
              <FormField
                control={form.control}
                name="lastWorkingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">آخر يوم عمل <AITooltip field="lastWorkingDay" requestType="resignation" /></FormLabel>
                    <FormControl>
                       <DatePicker date={field.value} setDate={field.onChange} placeholder="اختر تاريخًا" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {requestType === 'overtime' && (
               <>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">التاريخ <AITooltip field="date" requestType="overtime" /></FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} setDate={field.onChange} placeholder="اختر تاريخًا" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الساعات</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="مثال: 2.5" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">السبب <AITooltip field="reason" requestType={requestType} /></FormLabel>
                  <FormControl>
                    <Textarea placeholder={`يرجى تقديم سبب لطلب ${requestTypeOptions.find(o => o.value === requestType)?.label}...`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full font-semibold">
              <Send className="ml-2 h-4 w-4" /> إرسال الطلب
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


