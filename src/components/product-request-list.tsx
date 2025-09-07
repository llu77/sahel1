
"use client";

import type { ProductRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { History, Printer } from "lucide-react";

interface ProductRequestListProps {
  requests: ProductRequest[];
  onPrintRequest: (request: ProductRequest) => void;
}

export function ProductRequestList({ requests, onPrintRequest }: ProductRequestListProps) {
  const branchLabels: Record<'laban' | 'tuwaiq', string> = {
    laban: 'فرع لبن',
    tuwaiq: 'فرع طويق',
  };

  const formatInvoiceId = (id: string) => {
    return id.slice(-5).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><History /> سجل الطلبات الأخيرة</CardTitle>
        <CardDescription>قائمة بآخر 10 طلبات منتجات تم حفظها.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">رقم الطلب</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الموظف</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead className="text-left w-[120px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Badge variant="secondary">{formatInvoiceId(request.id)}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(request.requestDate, "PPP", { locale: ar })}
                  </TableCell>
                  <TableCell>{branchLabels[request.branch]}</TableCell>
                   <TableCell className="font-medium">{request.employeeName}</TableCell>
                  <TableCell className="font-semibold">{request.grandTotal.toLocaleString()} ريال</TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrintRequest(request)}
                    >
                      <Printer className="ml-2 h-4 w-4" />
                      طباعة
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    لم يتم العثور على طلبات.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
