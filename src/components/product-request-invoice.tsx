
"use client";

import React from 'react';
import type { ProductRequest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Briefcase } from 'lucide-react';

export const ProductRequestInvoice = React.forwardRef<HTMLDivElement, { request: ProductRequest }>(({ request }, ref) => {
    
    const formatInvoiceId = (id: string) => {
      return id.slice(-5).toUpperCase();
    };

    return (
        <Card ref={ref} className="w-full max-w-4xl mx-auto p-4 sm:p-8 print:shadow-none print:border-none">
            <CardHeader className="p-4 sm:p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <Briefcase className="h-10 w-10 text-primary" />
                            <h1 className="text-3xl font-bold font-headline">Symbol AI Co.</h1>
                        </div>
                        <p className="text-muted-foreground">حلول أعمال متكاملة</p>
                    </div>
                    <div className="text-left">
                        <CardTitle className="font-headline text-2xl mb-1">فاتورة طلب شراء</CardTitle>
                        <p className="text-muted-foreground">رقم الطلب: {formatInvoiceId(request.id)}</p>
                    </div>
                </div>
                <div className="border-t mt-6 pt-4 text-sm flex justify-between">
                    <div>
                        <p><span className="font-semibold">تاريخ الطلب:</span> {format(request.requestDate, 'PPP', { locale: ar })}</p>
                        <p><span className="font-semibold">اسم الموظف:</span> {request.employeeName}</p>
                    </div>
                     <div className="text-left">
                        <p><span className="font-semibold">الفرع:</span> {request.branch === 'laban' ? 'فرع لبن' : 'فرع طويق'}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">م</TableHead>
                            <TableHead>اسم المنتج</TableHead>
                            <TableHead className="text-center">الكمية</TableHead>
                            <TableHead className="text-center">سعر الوحدة</TableHead>
                            <TableHead className="text-left">الإجمالي</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {request.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-center">{item.price.toLocaleString()} ريال</TableCell>
                                <TableCell className="text-left font-semibold">{item.total.toLocaleString()} ريال</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex justify-end p-4 sm:p-6">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex justify-between items-center text-xl font-bold p-3 bg-primary/10 rounded-md">
                        <span>الإجمالي الكلي</span>
                        <span>{request.grandTotal.toLocaleString()} ريال</span>
                    </div>
                </div>
            </CardFooter>
            <div className="text-center text-xs text-muted-foreground mt-8 print:block">
                <p>هذه الفاتورة تم إنشاؤها بواسطة نظام سهل. ©️ جميع الحقوق محفوظة.</p>
            </div>
        </Card>
    );
});

ProductRequestInvoice.displayName = 'ProductRequestInvoice';
