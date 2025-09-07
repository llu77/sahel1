"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRequests } from "@/contexts/requests-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle, CircleEllipsis, CircleX, FileText, ListChecks, PlusCircle, Settings, CalendarDays, CircleDollarSign, LogOut, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import type { ExtendedRequest, RequestStatus, SahlRequest } from "@/lib/types";

const statusConfig: Record<RequestStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "قيد المراجعة", className: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: CircleEllipsis },
  approved: { label: "موافق عليه", className: "bg-green-500/10 text-green-700 border-green-500/20", icon: CheckCircle },
  rejected: { label: "مرفوض", className: "bg-red-500/10 text-red-700 border-red-500/20", icon: CircleX },
};

const typeLabels: Record<SahlRequest["type"], { label: string; icon: React.ReactNode }> = {
  leave: { label: "إجازة", icon: <CalendarDays className="h-4 w-4" /> },
  advance: { label: "سلفة", icon: <CircleDollarSign className="h-4 w-4" /> },
  resignation: { label: "استقالة", icon: <LogOut className="h-4 w-4" /> },
  overtime: { label: "عمل إضافي", icon: <Clock className="h-4 w-4" /> },
};

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: React.ElementType; color?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-5 w-5", color || "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", color || "")}>{value}</div>
      </CardContent>
    </Card>
  );
}

export default function RequestsHubPage() {
  const { user } = useAuth();
  const { requests, loading } = useRequests();

  const isAdmin = user?.role === "admin";

  const myRequests = React.useMemo(() => {
    if (!user) return [] as ExtendedRequest[];
    return requests.filter((r) => r.userId === user.email);
  }, [requests, user]);

  const sortByDateDesc = (arr: ExtendedRequest[]) =>
    [...arr].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  const recentMine = sortByDateDesc(myRequests).slice(0, 5);
  const pendingAll = requests.filter((r) => r.status === "pending");
  const recentPending = sortByDateDesc(pendingAll).slice(0, 8);

  const statsMine = {
    total: myRequests.length,
    pending: myRequests.filter((r) => r.status === "pending").length,
    approved: myRequests.filter((r) => r.status === "approved").length,
    rejected: myRequests.filter((r) => r.status === "rejected").length,
  };

  const statsAll = {
    total: requests.length,
    pending: pendingAll.length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">الطلبات</h1>
          <p className="text-muted-foreground mt-1">نظرة موحدة لإرسال الطلبات وتتبعها وإدارتها.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/new-request"><PlusCircle className="ml-2 h-4 w-4" /> طلب جديد</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/my-requests"><ListChecks className="ml-2 h-4 w-4" /> طلباتي</Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="secondary">
              <Link href="/requests-management"><Settings className="ml-2 h-4 w-4" /> إدارة الطلبات</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي طلباتي" value={statsMine.total} icon={FileText} />
        <StatCard title="قيد المراجعة (لي)" value={statsMine.pending} icon={CircleEllipsis} color="text-amber-500" />
        <StatCard title="موافق عليها (لي)" value={statsMine.approved} icon={CheckCircle} color="text-green-500" />
        <StatCard title="مرفوضة (لي)" value={statsMine.rejected} icon={CircleX} color="text-red-500" />
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="إجمالي كل الطلبات" value={statsAll.total} icon={FileText} />
          <StatCard title="قيد المراجعة (الكل)" value={statsAll.pending} icon={CircleEllipsis} color="text-amber-500" />
          <StatCard title="موافق عليها (الكل)" value={statsAll.approved} icon={CheckCircle} color="text-green-500" />
          <StatCard title="مرفوضة (الكل)" value={statsAll.rejected} icon={CircleX} color="text-red-500" />
        </div>
      )}

      <Tabs defaultValue={isAdmin ? "mine" : "mine"}>
        <TabsList>
          <TabsTrigger value="mine">أحدث طلباتي</TabsTrigger>
          {isAdmin && <TabsTrigger value="pending">قيد المراجعة (إداري)</TabsTrigger>}
        </TabsList>

        <TabsContent value="mine" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">أحدث طلباتي</CardTitle>
              <CardDescription>أحدث خمسة طلبات قمت بتقديمها.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">النوع</TableHead>
                      <TableHead>التفاصيل</TableHead>
                      <TableHead className="w-[180px]">تاريخ الإرسال</TableHead>
                      <TableHead className="text-left w-[160px]">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMine.length > 0 ? recentMine.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-lg bg-secondary grid place-items-center">
                              {typeLabels[req.type].icon}
                            </div>
                            <div className="font-medium">{typeLabels[req.type].label}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground truncate max-w-[420px]">{renderRequestDetails(req)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDistanceToNow(req.submittedAt, { addSuffix: true, locale: ar })}
                          </div>
                          <div className="text-xs text-muted-foreground">{format(req.submittedAt, "PPP p", { locale: ar })}</div>
                        </TableCell>
                        <TableCell className="text-left">
                          <Badge variant="outline" className={cn("gap-1.5", statusConfig[req.status].className)}>
                            {React.createElement(statusConfig[req.status].icon, { className: "h-4 w-4" })}
                            {statusConfig[req.status].label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">لا توجد بيانات.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">طلبات قيد المراجعة</CardTitle>
                <CardDescription>آخر الطلبات التي تحتاج إلى قرار إداري.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[420px]">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الموظف</TableHead>
                          <TableHead>النوع</TableHead>
                          <TableHead>التفاصيل</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead className="text-left">إجراء</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPending.length > 0 ? recentPending.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell>
                              <div className="font-medium">{req.employeeName}</div>
                              <div className="text-xs text-muted-foreground">{req.branch === 'laban' ? 'لبن' : 'طويق'}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1.5">
                                {typeLabels[req.type].icon}
                                {typeLabels[req.type].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground truncate max-w-[360px]">{renderRequestDetails(req)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{format(req.submittedAt, "PPP", { locale: ar })}</div>
                            </TableCell>
                            <TableCell className="text-left">
                              <Button asChild size="sm" variant="ghost">
                                <Link href="/requests-management">مراجعة</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">لا توجد طلبات قيد المراجعة.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          { type: 'leave', label: 'طلب إجازة', icon: CalendarDays, color: 'text-sky-500' },
          { type: 'advance', label: 'طلب سلفة', icon: CircleDollarSign, color: 'text-emerald-500' },
          { type: 'resignation', label: 'طلب استقالة', icon: LogOut, color: 'text-rose-500' },
          { type: 'overtime', label: 'طلب عمل إضافي', icon: Clock, color: 'text-amber-600' },
        ] as const).map((item) => (
          <Card key={item.type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-headline flex items-center gap-2">
                {React.createElement(item.icon, { className: `h-5 w-5 ${item.color}` })}
                {item.label}
              </CardTitle>
              <CardDescription>ابدأ هذا النوع من الطلب مباشرة.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/new-request?type=${item.type}`}>بدء الطلب</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function renderRequestDetails(request: ExtendedRequest): string {
  switch (request.type) {
    case "leave":
      return request.startDate && request.endDate
        ? `التواريخ: ${format(request.startDate, "d/M", { locale: ar })} إلى ${format(request.endDate, "d/M/yy", { locale: ar })}`
        : "";
    case "advance":
      return request.amount ? `المبلغ: ${request.amount} ريال` : "";
    case "resignation":
      return request.lastWorkingDay ? `آخر يوم عمل: ${format(request.lastWorkingDay, "d/M/yy", { locale: ar })}` : "";
    case "overtime":
      return request.date && request.hours
        ? `الساعات: ${request.hours} في ${format(request.date, "d/M/yy", { locale: ar })}`
        : "";
    default:
      return "";
  }
}
