"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/datepicker";
import { Send, PlusCircle, Trash2, ShoppingCart, Loader2, Save, Printer } from "lucide-react";
import React, { useCallback, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useAuth } from "@/contexts/auth-context";


// استبدال قائمة المنتجات القديمة بقائمة مفصلة مع السعر والفئة
const products = [
  { name: "حلويل ستار حمام زيت بخلاصة جوز الهند 1500مل", price: 14.12, category: "hair_care" },
  { name: "حلويل ستار حمام زيت بخلاصة البابايا 1500مل", price: 14.12, category: "hair_care" },
  { name: "شامبو بالجوز والعسل 400مل", price: 7.50, category: "hair_care" },
  { name: "شامبو فاتيكا", price: 10.00, category: "hair_care" },
  { name: "سبراي تصفيف الشعر 400مل", price: 13.30, category: "hair_care" },
  { name: "بخاخ مغذي ومقوي للشعر 200مل", price: 9.82, category: "hair_care" },
  { name: "كريم تصفيف شعر", price: 15.00, category: "hair_care" },
  { name: "واكس للشعر", price: 27.00, category: "hair_care" },
  { name: "كريم واكس", price: 10.00, category: "hair_care" },
  // أدوات قص الشعر
  { name: "مقص شعر إيطالي ACCADEMY LINE 747/6", price: 19.35, category: "cutting_tools" },
  { name: "مقص شعر إيطالي STYLING LINE 748/5.5", price: 23.65, category: "cutting_tools" },
  { name: "أمشاط شعر", price: 10.00, category: "cutting_tools" },
  { name: "أمشاط شعر بلاستيك للبيع", price: 3.50, category: "cutting_tools" },
  { name: "صابون سنيتم مشط شعر BK23-096", price: 1.66, category: "cutting_tools" },
  // ماكينات الحلاقة
  { name: "جومني ماكينة حلاقة رجالي JB12", price: 66.67, category: "shaving_machines" },
  { name: "كيمي ماكينة حلاقة قطع 6558", price: 30.00, category: "shaving_machines" },
  { name: "BOOSTED Trimmer ماكينة حلاقة", price: 400.00, category: "shaving_machines" },
  { name: "زيت شفرات ماكينة الحلاقة 120مل", price: 6.98, category: "shaving_machines" },
  { name: "بلانكس أمواس حلاقة أزرق 50حبه", price: 23.05, category: "shaving_machines" },
  // منتجات الحلاقة
  { name: "كورمز جل الحلاقة ارتيك راش 1000مل", price: 8.60, category: "shaving_products" },
  { name: "جل حلاقة Sahon", price: 5.00, category: "shaving_products" },
  { name: "بخاخ عطر بعد الحلاقة أحمر باربر NO3 250مل", price: 7.53, category: "shaving_products" },
  { name: "افتر شيفنق بعد الحلاقة", price: 10.00, category: "shaving_products" },
  { name: "كورمز ملمع للرجه قطع 500", price: 8.60, category: "shaving_products" },
  { name: "بودرة ترم بلانر وردي 200جرام", price: 5.93, category: "shaving_products" },
  { name: "بودره", price: 10.00, category: "shaving_products" },
  // منتجات الشمع
  { name: "شمع بالياز حبيبات أزرق 1000جرام", price: 37.45, category: "wax_products" },
  { name: "شمع كرات قطن أبيض 40جرام", price: 2.10, category: "wax_products" },
  { name: "واكس سيستم أعود خشبية 50حبه", price: 0, category: "wax_products" },
  { name: "خيط فتلة للبندي أبيض", price: 2.45, category: "wax_products" },
  { name: "فتاله", price: 25.00, category: "wax_products" },
  // منتجات العناية بالبشرة
  { name: "غسول وجه ليمون 25مل", price: 2.70, category: "skin_care" },
  { name: "ليمون منظف للوجه", price: 0, category: "skin_care" },
  { name: "سفنج تنظيف البشرة 12حبه", price: 9.00, category: "skin_care" },
  { name: "ماسك وجه", price: 20.00, category: "skin_care" },
  { name: "سيروم كولاجين", price: 25.00, category: "skin_care" },
  { name: "سيروم فيتامين سي", price: 25.00, category: "skin_care" },
  // المناديل والمناشف
  { name: "بلاتينا مناديل رقيقة ناعمة 600×10", price: 31.70, category: "tissues" },
  { name: "مناديل ورقية 600×10", price: 34.00, category: "tissues" },
  { name: "مناديل رول بقايا", price: 8.00, category: "tissues" },
  { name: "مناشف استخدام مره واحدة 100×50", price: 19.88, category: "tissues" },
  { name: "الخزامي نصفة ألف استخدام مرة واحدة 20حبه", price: 4.34, category: "tissues" },
  { name: "صابون مناشف منعملة 24حبه", price: 10.75, category: "tissues" },
  { name: "صابون مناشف منعملة 12حبه", price: 5.75, category: "tissues" },
  { name: "ورق رقبه", price: 10.00, category: "tissues" },
  { name: "ورق رقية", price: 0, category: "tissues" },
  { name: "ورق طابعه", price: 25.00, category: "tissues" },
  // القفازات والكمامات
  { name: "قلفز اسود مقاس اكس لارج", price: 6.00, category: "protection" },
  { name: "قلفز اسود مقاس لارج", price: 6.00, category: "protection" },
  { name: "صابون سنيتم قفاز 20 SS300حبه", price: 5.38, category: "protection" },
  { name: "فقرات قيل بدون بودرة أسود مقاس للرج 100", price: 0, category: "protection" },
  { name: "كمامة عقبة 50حبه", price: 4.82, category: "protection" },
  { name: "كمامة وجه", price: 0, category: "protection" },
  // المرايل وأدوات الحماية
  { name: "مربلة بلاستيك استخدام واحد أبيض", price: 3.77, category: "aprons" },
  { name: "مربلة بلاستيك أصفر", price: 0, category: "aprons" },
  { name: "مريله بلاستيك كرتون", price: 10.00, category: "aprons" },
  // منتجات التنظيف والتعقيم
  { name: "ديتول", price: 10.00, category: "cleaning" },
  { name: "صابون سنيم بخاخ ماء BK23-273", price: 6.00, category: "cleaning" },
  { name: "أكياس سوداء 50 جالون", price: 10.00, category: "cleaning" },
  { name: "أكياس صفراء 8 جالون", price: 10.00, category: "cleaning" },
  { name: "مكنسه", price: 10.00, category: "cleaning" },
  // متنوعات
  { name: "أعواد قطن أذن", price: 4.00, category: "misc" },
  { name: "صبغه دقن", price: 25.00, category: "misc" },
  { name: "معطر 500 مل", price: 100.00, category: "misc" },
  { name: "اسبريه", price: 10.00, category: "misc" }
];

// ترتيب الفئات بدون عرض أسمائها في الواجهة
const categoryOrder: Array<
  | 'hair_care'
  | 'cutting_tools'
  | 'shaving_machines'
  | 'shaving_products'
  | 'wax_products'
  | 'skin_care'
  | 'tissues'
  | 'protection'
  | 'aprons'
  | 'cleaning'
  | 'misc'
> = [
  'hair_care',
  'cutting_tools',
  'shaving_machines',
  'shaving_products',
  'wax_products',
  'skin_care',
  'tissues',
  'protection',
  'aprons',
  'cleaning',
  'misc',
];

const sortedProducts = [...products].sort((a, b) => {
  const catDiff = categoryOrder.indexOf(a.category as any) - categoryOrder.indexOf(b.category as any);
  if (catDiff !== 0) return catDiff;
  return a.name.localeCompare(b.name, 'ar');
});

const productRequestFormSchema = z.object({
  branch: z.enum(['laban', 'tuwaiq'], { required_error: "يرجى تحديد الفرع." }),
  requestDate: z.date({ required_error: "تاريخ الطلب مطلوب." }),
  items: z.array(z.object({
      productName: z.string().min(1, "يرجى تحديد المنتج."),
      quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل."),
      price: z.coerce.number().min(0, "السعر لا يمكن أن يكون سالبًا."),
      total: z.number().min(0),
  })).min(1, "يجب إضافة منتج واحد على الأقل.").max(20, "لا يمكن إضافة أكثر من 20 منتجًا."),
});

export type FormValues = z.infer<typeof productRequestFormSchema>;

interface ProductRequestFormProps {
    onSubmit: (data: FormValues) => Promise<void>;
    isSubmitting: boolean;
    onPrint: () => void;
    isPrintable: boolean;
}

export function ProductRequestForm({ onSubmit, isSubmitting, onPrint, isPrintable }: ProductRequestFormProps) {
  const { user } = useAuth();

  // خريطة تسعير حسب الاسم للتعبئة التلقائية
  const priceByName = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of sortedProducts) map[p.name] = p.price ?? 0;
    return map;
  }, []);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(productRequestFormSchema),
    defaultValues: {
      branch: user?.role !== 'admin' ? user?.branch : undefined,
      requestDate: new Date(),
      items: [{ productName: "", quantity: 1, price: 0, total: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch('items');

  const handleItemChange = useCallback((index: number, field: 'quantity' | 'price', value: number) => {
    const items = form.getValues('items');
    const item = items[index];
    if (item) {
      const quantity = field === 'quantity' ? value : item.quantity;
      const price = field === 'price' ? value : item.price;
      const total = (quantity || 0) * (price || 0);
      form.setValue(`items.${index}.${field}`, value, { shouldValidate: true, shouldDirty: true });
      form.setValue(`items.${index}.total`, total, { shouldValidate: true, shouldDirty: true });
    }
  }, [form]);

  // تعبئة السعر والإجمالي تلقائياً عند اختيار المنتج
  const handleProductSelect = useCallback((index: number, name: string) => {
    const price = priceByName[name] ?? 0;
    const currentQty = form.getValues(`items.${index}.quantity`) || 1;
    form.setValue(`items.${index}.productName`, name, { shouldValidate: true, shouldDirty: true });
    form.setValue(`items.${index}.price`, price, { shouldValidate: true, shouldDirty: true });
    form.setValue(`items.${index}.total`, (currentQty || 0) * (price || 0), { shouldValidate: true, shouldDirty: true });
  }, [form, priceByName]);
  
  const grandTotal = watchedItems.reduce((acc, item) => acc + (item.total || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart /> طلب منتجات</CardTitle>
        <CardDescription>املا النموذج أدناه لتقديم طلب شراء منتجات</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
               <FormField control={form.control} name="branch" render={({ field }) => (
                <FormItem>
                  <FormLabel>الفرع</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={user?.role !== 'admin'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفرع مقدم الطلب" />
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
               <FormField control={form.control} name="requestDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ الطلب</FormLabel>
                   <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} placeholder="اختر تاريخ الطلب" />
                   </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div>
              <FormLabel>المنتجات المطلوبة</FormLabel>
              <div className="mt-2 border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">المنتج</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>السعر</TableHead>
                            <TableHead>الإجمالي</TableHead>
                            <TableHead className="w-[50px]">إجراء</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                           <TableRow key={field.id}>
                                <TableCell>
                                    <FormField control={form.control} name={`items.${index}.productName`} render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={(val) => handleProductSelect(index, val)} value={field.value}>
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="اختر منتجًا" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {sortedProducts.map(p => (
                                                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </TableCell>
                                <TableCell>
                                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                        <FormItem>
                                            <Input type="number" {...field} value={field.value ?? 1} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} />
                                            <FormMessage />
                                        </FormItem>
                                     )} />
                                </TableCell>
                                <TableCell>
                                    <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                                         <FormItem>
                                             <Input type="number" {...field} value={field.value ?? 0} onChange={e => handleItemChange(index, 'price', Number(e.target.value))} />
                                             <FormMessage />
                                         </FormItem>
                                     )} />
                                </TableCell>
                                <TableCell>
                                    <Input disabled value={`${(watchedItems[index]?.total || 0).toLocaleString()} ريال`} className="font-semibold" />
                                </TableCell>
                                <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ productName: '', quantity: 1, price: 0, total: 0 })}>
                    <PlusCircle className="ml-2 h-4 w-4" /> إضافة منتج
                </Button>
                <FormMessage>{form.formState.errors.items?.message || (form.formState.errors.items as any)?.root?.message}</FormMessage>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-secondary/50 p-4 rounded-b-lg">
             <div className="text-xl font-bold">
                الإجمالي الكلي: {grandTotal.toLocaleString()} ريال
             </div>
             <div className="flex gap-2">
                <Button type="submit" className="font-semibold w-32" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="ml-2 h-4 w-4" /> حفظ</>}
                </Button>
                <Button type="button" variant="outline" className="font-semibold w-32" onClick={onPrint} disabled={!isPrintable || isSubmitting}>
                    <Printer className="ml-2 h-4 w-4" /> طباعة
                </Button>
             </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
