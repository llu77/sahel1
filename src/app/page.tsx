
"use client";

import { useAuth } from "@/contexts/auth-context";
import AdminDashboard from "@/components/admin-dashboard";
import Dashboard from "@/components/dashboard";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading || !isAuthenticated) {
         return (
            <div className="flex h-screen w-full items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 text-center">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-48 mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    if (user?.role === 'admin') {
        return <AdminDashboard />;
    }
    
    return <Dashboard />;
}
