"use client";

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { FinancialDataProvider } from "@/contexts/financial-data-context-api";
import { ProductRequestsProvider } from "@/contexts/product-requests-context";
import { RequestsProvider } from "@/contexts/requests-context";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Briefcase, LogOut, User as UserIcon, Settings, TrendingUp, TrendingDown, Award, ShoppingCart, BarChartHorizontal, ListOrdered, Home, PlusCircle, ListChecks, Users } from "lucide-react";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from 'next/navigation';
import Logo from '@/components/ui/logo';

// Since we are using client-side providers, we cannot use Metadata export directly.
// This can be configured differently if needed, for example in a sub-layout.

// export const metadata: Metadata = {
//   title: 'Symbol AI co. - Financial Dashboard',
//   description: 'نظام مالي متكامل لإدارة الإيرادات والمصروفات والموظفين',
// };


function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) {
        return <>{children}</>
    }

    const isAdmin = user.role === 'admin';

    const getIsActive = (path: string) => pathname === path;

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col">
                <Sidebar>
                    <SidebarContent>
                        <SidebarHeader>
                            <Link href="/" passHref className="flex items-center justify-center py-4">
                                <Logo width={120} height={50} />
                            </Link>
                        </SidebarHeader>
                        <ScrollArea className="flex-1">
                            <SidebarMenu>
                                 <SidebarMenuItem>
                                    <Link href="/" passHref legacyBehavior>
                                        <SidebarMenuButton asChild isActive={getIsActive('/')}>
                                            <a><Home className="w-4 h-4 mr-2" />الرئيسية</a>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>

                                {isAdmin ? (
                                     <>
                                        <SidebarMenuItem>
                                            <Link href="/reports" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/reports')}>
                                                    <a><BarChartHorizontal className="w-4 h-4 mr-2" />التقارير</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/users" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/users')}>
                                                    <a><Users className="w-4 h-4 mr-2" />إدارة المستخدمين</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/requests-management" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/requests-management')}>
                                                    <a><Settings className="w-4 h-4 mr-2" />إدارة الطلبات</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/revenues" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/revenues')}>
                                                    <a><TrendingUp className="w-4 h-4 mr-2" />الإيرادات</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/expenses" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/expenses')}>
                                                    <a><TrendingDown className="w-4 h-4 mr-2" />المصاريف</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/bonus" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/bonus')}>
                                                    <a><Award className="w-4 h-4 mr-2" />البونص</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/bonus-rules" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/bonus-rules')}>
                                                    <a><ListOrdered className="w-4 h-4 mr-2" />إدارة البونص</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/product-requests" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/product-requests')}>
                                                    <a><ShoppingCart className="w-4 h-4 mr-2" />طلبات المنتجات</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/requests" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/requests')}>
                                                    <a><ListChecks className="w-4 h-4 mr-2" />الطلبات</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                     </>
                                ) : (
                                    <>
                                        <SidebarMenuItem>
                                            <Link href="/new-request" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/new-request')}>
                                                    <a><PlusCircle className="w-4 h-4 mr-2" />طلب جديد</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/my-requests" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/my-requests')}>
                                                    <a><ListChecks className="w-4 h-4 mr-2" />طلباتي</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/revenues" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/revenues')}>
                                                    <a><TrendingUp className="w-4 h-4 mr-2" />الإيرادات</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/expenses" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/expenses')}>
                                                    <a><TrendingDown className="w-4 h-4 mr-2" />المصاريف</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/product-requests" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/product-requests')}>
                                                    <a><ShoppingCart className="w-4 h-4 mr-2" />طلب منتجات</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <Link href="/requests" passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={getIsActive('/requests')}>
                                                    <a><ListChecks className="w-4 h-4 mr-2" />الطلبات</a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                    </>
                                )}
                            </SidebarMenu>
                        </ScrollArea>
                    </SidebarContent>
                </Sidebar>
                <SidebarInset className="flex flex-col">
                    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger />
                        </div>
                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user?.avatar} alt={user?.name} />
                                            <AvatarFallback><UserIcon /></AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {user?.name}
                                                {user?.title && <small className="text-sm font-medium leading-none text-muted-foreground ml-2">({user.title})</small>}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>تسجيل الخروج</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto">
                        <div className="p-4 md:p-8">
                            {children}
                        </div>
                    </main>
                    <footer className="border-t py-4 text-center text-sm text-muted-foreground no-print">
                        Symbol AI Co. - جميع الحقوق محفوظة © {new Date().getFullYear()}
                    </footer>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>Sahl Request</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
            <RequestsProvider>
                <FinancialDataProvider>
                    <ProductRequestsProvider>
                        <Toaster />
                        <AppLayout>
                          {children}
                        </AppLayout>
                    </ProductRequestsProvider>
                </FinancialDataProvider>
            </RequestsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
