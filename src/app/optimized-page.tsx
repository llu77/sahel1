"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from 'next/navigation';
import { useEffect, lazy, Suspense } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { performanceMonitor } from '@/lib/performance-utils';

// Lazy load dashboard components
const AdminDashboard = lazy(() => {
  return performanceMonitor.measureAsync('Load AdminDashboard', 
    () => import('@/components/admin-dashboard')
  );
});

const Dashboard = lazy(() => {
  return performanceMonitor.measureAsync('Load Dashboard',
    () => import('@/components/dashboard')
  );
});

// Loading component
const DashboardLoader = () => (
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

export default function OptimizedHome() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    performanceMonitor.mark('page-load-start');
    
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
    
    return () => {
      performanceMonitor.measure('Page Load Complete', 'page-load-start');
    };
  }, [loading, isAuthenticated, router]);

  // Preload components based on user role
  useEffect(() => {
    if (user?.role === 'admin') {
      // Preload admin-specific components
      import('@/components/admin-dashboard');
    } else if (user?.role === 'user') {
      // Preload user-specific components
      import('@/components/dashboard');
    }
  }, [user?.role]);

  if (loading || !isAuthenticated) {
    return <DashboardLoader />;
  }

  return (
    <Suspense fallback={<DashboardLoader />}>
      {user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />}
    </Suspense>
  );
}