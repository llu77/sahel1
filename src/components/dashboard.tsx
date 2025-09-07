
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PlusCircle, ListChecks } from "lucide-react";
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();

  return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8 h-full">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline mb-2">أهلاً بك، {user?.name}</h1>
            <p className="text-muted-foreground">ماذا تريد أن تفعل اليوم؟</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full max-w-4xl">
            <Link href="/new-request">
                  <Card className="hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                              <PlusCircle className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                            <CardTitle className="font-headline text-2xl">طلب جديد</CardTitle>
                            <CardDescription className="mt-1">تقديم طلب إجازة، سلفة، استقالة، أو عمل إضافي.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </Link>
              <Link href="/my-requests">
                <Card className="hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group">
                    <CardHeader>
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <ListChecks className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="font-headline text-2xl">طلباتي</CardTitle>
                                <CardDescription className="mt-1">عرض ومتابعة حالة جميع طلباتك المقدمة.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </Link>
        </div>
      </div>
  );
}
