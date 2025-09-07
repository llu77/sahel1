
"use client";

import type { SahlRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarDays, CircleCheck, CircleDollarSign, CircleEllipsis, CircleX, Clock, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const requestIcons: Record<SahlRequest['type'], React.ReactNode> = {
  leave: <CalendarDays className="h-5 w-5" />,
  advance: <CircleDollarSign className="h-5 w-5" />,
  resignation: <LogOut className="h-5 w-5" />,
  overtime: <Clock className="h-5 w-5" />,
};

const statusConfig: Record<SahlRequest['status'], { icon: React.ReactNode; className: string; label: string; }> = {
  pending: {
    icon: <CircleEllipsis />,
    className: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
    label: "قيد المراجعة",
  },
  approved: {
    icon: <CircleCheck />,
    className: "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20",
    label: "موافق عليه",
  },
  rejected: {
    icon: <CircleX />,
    className: "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20",
    label: "مرفوض",
  },
};

const typeLabels: Record<SahlRequest['type'], string> = {
    leave: 'إجازة',
    advance: 'سلفة',
    resignation: 'استقالة',
    overtime: 'عمل إضافي',
}

const getRequestDetails = (request: SahlRequest) => {
    switch(request.type) {
        case 'leave': return `${format(request.startDate, 'd MMM', { locale: ar })} - ${format(request.endDate, 'd MMM, yyyy', { locale: ar })}`;
        case 'advance': return `${request.amount.toLocaleString()} ريال`;
        case 'resignation': return `آخر يوم عمل: ${format(request.lastWorkingDay, 'd MMM, yyyy', { locale: ar })}`;
        case 'overtime': return `${request.hours} ساعات في ${format(request.date, 'd MMM, yyyy', { locale: ar })}`;
    }
}

export function RequestList({ requests }: { requests: SahlRequest[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">طلباتي</CardTitle>
        <CardDescription>سجل بطلباتك المقدمة وحالتها.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">النوع</TableHead>
              <TableHead>التفاصيل</TableHead>
              <TableHead className="w-[150px]">تاريخ الإرسال</TableHead>
              <TableHead className="text-left w-[120px]">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary">
                                {requestIcons[request.type]}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="capitalize">{typeLabels[request.type]}</p>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{getRequestDetails(request)}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-xs">{request.reason}</div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger>
                              {formatDistanceToNow(request.submittedAt, { addSuffix: true, locale: ar })}
                          </TooltipTrigger>
                          <TooltipContent>
                              {format(request.submittedAt, "PPP p", { locale: ar })}
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-left">
                  <Badge variant="outline" className={cn("gap-1.5", statusConfig[request.status].className)}>
                    {statusConfig[request.status].icon}
                    {statusConfig[request.status].label}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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
