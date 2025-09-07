import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

// Loading components for better UX
const TableLoader = () => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
  </div>
);

const ChartLoader = () => (
  <div className="space-y-3">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const FormLoader = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-10 w-32" />
  </div>
);

const CardLoader = () => (
  <div className="rounded-lg border p-6">
    <Skeleton className="h-6 w-32 mb-4" />
    <Skeleton className="h-24 w-full" />
  </div>
);

// Lazy loaded components with custom loading states
export const LazyAdminDashboard = dynamic(
  () => import('@/components/admin-dashboard'),
  {
    loading: () => <CardLoader />,
    ssr: false
  }
);

export const LazyDashboard = dynamic(
  () => import('@/components/dashboard'),
  {
    loading: () => <CardLoader />,
    ssr: false
  }
);

export const LazyRequestForm = dynamic(
  () => import('@/components/request-form'),
  {
    loading: () => <FormLoader />
  }
);

export const LazyRequestList = dynamic(
  () => import('@/components/request-list').then(mod => ({ default: mod.RequestList })),
  {
    loading: () => <TableLoader />
  }
);

export const LazyProductRequestForm = dynamic(
  () => import('@/components/product-request-form').then(mod => ({ default: mod.ProductRequestForm })),
  {
    loading: () => <FormLoader />
  }
);

export const LazyProductRequestList = dynamic(
  () => import('@/components/product-request-list').then(mod => ({ default: mod.ProductRequestList })),
  {
    loading: () => <TableLoader />
  }
);

export const LazyProductRequestInvoice = dynamic(
  () => import('@/components/product-request-invoice').then(mod => ({ default: mod.ProductRequestInvoice })),
  {
    loading: () => <CardLoader />
  }
);

// Heavy UI components
export const LazyChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  {
    loading: () => <ChartLoader />,
    ssr: false
  }
);

export const LazyBarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  {
    loading: () => <ChartLoader />,
    ssr: false
  }
);

export const LazyPieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  {
    loading: () => <ChartLoader />,
    ssr: false
  }
);

// Table components
export const LazyDataTable = dynamic(
  () => import('@/components/ui/table').then(mod => ({ default: mod.Table })),
  {
    loading: () => <TableLoader />
  }
);

// Dialog components
export const LazyDialog = dynamic(
  () => import('@/components/ui/dialog').then(mod => ({ default: mod.Dialog })),
  {
    loading: () => null,
    ssr: false
  }
);

export const LazyAlertDialog = dynamic(
  () => import('@/components/ui/alert-dialog').then(mod => ({ default: mod.AlertDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

// Form components
export const LazyDatePicker = dynamic(
  () => import('@/components/ui/datepicker').then(mod => ({ default: mod.DatePicker })),
  {
    loading: () => <Skeleton className="h-10 w-full" />,
    ssr: false
  }
);

export const LazySelect = dynamic(
  () => import('@/components/ui/select').then(mod => ({ default: mod.Select })),
  {
    loading: () => <Skeleton className="h-10 w-full" />
  }
);

// Heavy third-party components
export const LazyReactToPrint = dynamic(
  () => import('react-to-print'),
  {
    loading: () => null,
    ssr: false
  }
);

export const LazyFramerMotion = dynamic(
  () => import('framer-motion'),
  {
    loading: () => null,
    ssr: false
  }
);

// Utility function to preload components
export const preloadComponent = (component: any) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      component.preload?.();
    });
  }
};

// Hook to preload components based on user interaction
export const usePreloadOnHover = (component: any) => {
  const handleMouseEnter = React.useCallback(() => {
    preloadComponent(component);
  }, [component]);

  return { onMouseEnter: handleMouseEnter };
};

// Hook to preload components when they're likely to be needed
export const usePreloadOnIdle = (components: any[]) => {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = requestIdleCallback(() => {
        components.forEach(component => {
          component.preload?.();
        });
      }, { timeout: 2000 });

      return () => {
        if ('cancelIdleCallback' in window) {
          cancelIdleCallback(handle);
        }
      };
    }
  }, [components]);
};

// Error boundary for lazy components
export class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-500 mb-2">حدث خطأ في تحميل المكون</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-blue-500 underline"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for lazy loading with error boundary
export const LazyComponentWrapper: React.FC<{
  component: React.ComponentType<any>;
  props?: any;
  fallback?: React.ReactNode;
}> = ({ component: Component, props = {}, fallback }) => {
  return (
    <LazyComponentErrorBoundary fallback={fallback}>
      <React.Suspense fallback={fallback || <CardLoader />}>
        <Component {...props} />
      </React.Suspense>
    </LazyComponentErrorBoundary>
  );
};

export default {
  LazyAdminDashboard,
  LazyDashboard,
  LazyRequestForm,
  LazyRequestList,
  LazyProductRequestForm,
  LazyProductRequestList,
  LazyProductRequestInvoice,
  LazyChart,
  LazyBarChart,
  LazyPieChart,
  LazyDataTable,
  LazyDialog,
  LazyAlertDialog,
  LazyDatePicker,
  LazySelect,
  LazyReactToPrint,
  LazyFramerMotion,
  preloadComponent,
  usePreloadOnHover,
  usePreloadOnIdle,
  LazyComponentErrorBoundary,
  LazyComponentWrapper
};