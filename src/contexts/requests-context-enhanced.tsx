"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { ExtendedRequest, RequestStatus } from '@/lib/types';
import { 
  createRequestEnhanced,
  getRequestsEnhanced,
  getUserRequests,
  setRequestStatusEnhanced,
  deleteRequestEnhanced,
  getRequestStatistics,
  RequestError
} from '@/services/requests-enhanced';
import { branchSyncManager, connectionManager } from '@/lib/firebase-enhanced';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';

interface RequestStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<string, number>;
  byBranch?: Record<string, number>;
}

interface EnhancedRequestsContextType {
  requests: ExtendedRequest[];
  userRequests: ExtendedRequest[];
  addRequest: (request: Omit<ExtendedRequest, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  updateRequestStatus: (requestId: string, status: RequestStatus, reviewNotes: string) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  statistics: RequestStatistics | null;
  loading: boolean;
  syncing: boolean;
  connectionStatus: 'online' | 'offline' | 'syncing';
  lastSyncTime: Date | null;
  refreshData: () => Promise<void>;
}

const EnhancedRequestsContext = createContext<EnhancedRequestsContextType | undefined>(undefined);

export function EnhancedRequestsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ExtendedRequest[]>([]);
  const [userRequests, setUserRequests] = useState<ExtendedRequest[]>([]);
  const [statistics, setStatistics] = useState<RequestStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Monitor connection status
  useEffect(() => {
    const unsubscribe = connectionManager.addListener((isOnline) => {
      setConnectionStatus(isOnline ? 'online' : 'offline');
      
      if (isOnline) {
        toast({
          title: "🟢 الاتصال مستعاد",
          description: "تمت استعادة الاتصال بقاعدة البيانات",
          duration: 3000
        });
        syncData();
      } else {
        toast({
          title: "🔴 انقطع الاتصال",
          description: "العمل في وضع عدم الاتصال - سيتم المزامنة عند عودة الاتصال",
          variant: "destructive",
          duration: 5000
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  // Set up real-time sync for requests
  useEffect(() => {
    if (!user) return;

    const userBranch = user.branch || '';
    const userEmail = user.email || '';
    const isAdmin = user.role === 'admin';
    
    // Subscribe to real-time updates for all requests (branch filtered)
    const unsubscribeRequests = branchSyncManager.subscribeToBranch(
      'requests',
      userBranch,
      (data) => {
        // Filter out deleted requests
        const activeRequests = data.filter((r: any) => !r.deleted);
        
        // Convert dates
        const processedRequests = activeRequests.map((r: any) => ({
          ...r,
          submittedAt: r.submittedAt?.toDate ? r.submittedAt.toDate() : r.submittedAt,
          startDate: r.startDate?.toDate ? r.startDate.toDate() : r.startDate,
          endDate: r.endDate?.toDate ? r.endDate.toDate() : r.endDate,
          lastWorkingDay: r.lastWorkingDay?.toDate ? r.lastWorkingDay.toDate() : r.lastWorkingDay,
          date: r.date?.toDate ? r.date.toDate() : r.date,
        }));
        
        setRequests(processedRequests as ExtendedRequest[]);
        
        // Update user's own requests
        const ownRequests = processedRequests.filter((r: any) => r.userId === userEmail);
        setUserRequests(ownRequests as ExtendedRequest[]);
        
        setLastSyncTime(new Date());
        console.log(`📋 Requests updated: ${processedRequests.length} items`);
      },
      isAdmin // Admin sees all branches
    );

    setLoading(false);

    return () => {
      unsubscribeRequests();
    };
  }, [user]);

  // Load initial data and statistics
  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      const userEmail = user.email || '';
      
      // Load requests and statistics in parallel
      const [allRequests, ownRequests, stats] = await Promise.all([
        getRequestsEnhanced(userBranch, userRole, userEmail),
        getUserRequests(userEmail),
        getRequestStatistics(userBranch, userRole)
      ]);
      
      setRequests(allRequests);
      setUserRequests(ownRequests);
      setStatistics(stats);
      setLastSyncTime(new Date());
      
      toast({
        title: "✅ تم تحميل البيانات",
        description: `تم تحميل ${allRequests.length} طلب`,
        duration: 2000
      });
    } catch (error: any) {
      console.error("Failed to load initial data:", error);
      
      if (error instanceof RequestError) {
        toast({
          variant: 'destructive',
          title: "خطأ في تحميل البيانات",
          description: error.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في تحميل البيانات",
          description: "لم نتمكن من تحميل البيانات من قاعدة البيانات"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    if (syncing || !user) return;
    
    try {
      setSyncing(true);
      setConnectionStatus('syncing');
      
      await loadInitialData();
      
      toast({
        title: "✅ تمت المزامنة",
        description: "تم تحديث جميع البيانات بنجاح",
        duration: 2000
      });
    } catch (error) {
      console.error("Sync failed:", error);
      toast({
        variant: 'destructive',
        title: "فشلت المزامنة",
        description: "لم نتمكن من مزامنة البيانات"
      });
    } finally {
      setSyncing(false);
      setConnectionStatus(connectionManager.getStatus() ? 'online' : 'offline');
    }
  };

  const addRequest = async (requestData: Omit<ExtendedRequest, 'id' | 'submittedAt' | 'status'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً"
      });
      return;
    }

    try {
      setSyncing(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      const userEmail = user.email || '';
      
      const newRequest = await createRequestEnhanced(
        requestData,
        userBranch,
        userRole,
        userEmail
      );
      
      // Optimistically update local state
      setRequests(prev => [newRequest, ...prev]);
      if (newRequest.userId === userEmail) {
        setUserRequests(prev => [newRequest, ...prev]);
      }
      
      // Update statistics
      if (statistics) {
        setStatistics({
          ...statistics,
          total: statistics.total + 1,
          pending: statistics.pending + 1,
          byType: {
            ...statistics.byType,
            [newRequest.type]: (statistics.byType[newRequest.type] || 0) + 1
          }
        });
      }
      
      toast({
        title: "✅ تم إرسال الطلب",
        description: `تم إرسال طلب ${newRequest.title} بنجاح`,
        duration: 3000
      });
    } catch (error: any) {
      console.error("Failed to add request:", error);
      
      if (error instanceof RequestError) {
        if (error.code === 'BRANCH_ACCESS_DENIED') {
          toast({
            variant: 'destructive',
            title: "غير مسموح",
            description: error.message
          });
        } else if (error.code === 'VALIDATION_ERROR') {
          toast({
            variant: 'destructive',
            title: "خطأ في البيانات",
            description: error.message
          });
        } else {
          toast({
            variant: 'destructive',
            title: "خطأ في الحفظ",
            description: error.message
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في إرسال الطلب",
          description: "لم نتمكن من حفظ البيانات. يرجى المحاولة مرة أخرى"
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: RequestStatus, reviewNotes: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً"
      });
      return;
    }

    try {
      setSyncing(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      
      await setRequestStatusEnhanced(
        requestId,
        status,
        reviewNotes,
        userBranch,
        userRole
      );
      
      // Optimistically update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status, reviewNotes } 
          : req
      ));
      
      setUserRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status, reviewNotes } 
          : req
      ));
      
      // Update statistics
      if (statistics) {
        const oldRequest = requests.find(r => r.id === requestId);
        if (oldRequest) {
          const newStats = { ...statistics };
          
          // Update old status count
          if (oldRequest.status === 'pending') newStats.pending--;
          else if (oldRequest.status === 'approved') newStats.approved--;
          else if (oldRequest.status === 'rejected') newStats.rejected--;
          
          // Update new status count
          if (status === 'pending') newStats.pending++;
          else if (status === 'approved') newStats.approved++;
          else if (status === 'rejected') newStats.rejected++;
          
          setStatistics(newStats);
        }
      }
      
      const statusLabels = {
        approved: 'تمت الموافقة على',
        rejected: 'تم رفض',
        pending: 'تم إرجاع'
      };
      
      toast({
        title: "✅ تم التحديث",
        description: `${statusLabels[status]} الطلب بنجاح`,
        duration: 2000
      });
    } catch (error: any) {
      console.error("Failed to update request status:", error);
      
      if (error instanceof RequestError) {
        toast({
          variant: 'destructive',
          title: "خطأ في التحديث",
          description: error.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في التحديث",
          description: "لم نتمكن من تحديث حالة الطلب"
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً"
      });
      return;
    }

    try {
      setSyncing(true);
      const userBranch = user.branch || '';
      const userRole = user.role || 'user';
      const userEmail = user.email || '';
      
      await deleteRequestEnhanced(
        requestId,
        userBranch,
        userRole,
        userEmail
      );
      
      // Optimistically update local state
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setUserRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Update statistics
      if (statistics) {
        const deletedRequest = requests.find(r => r.id === requestId);
        if (deletedRequest) {
          const newStats = { ...statistics };
          newStats.total--;
          
          if (deletedRequest.status === 'pending') newStats.pending--;
          else if (deletedRequest.status === 'approved') newStats.approved--;
          else if (deletedRequest.status === 'rejected') newStats.rejected--;
          
          if (newStats.byType[deletedRequest.type]) {
            newStats.byType[deletedRequest.type]--;
          }
          
          setStatistics(newStats);
        }
      }
      
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف الطلب بنجاح",
        duration: 2000
      });
    } catch (error: any) {
      console.error("Failed to delete request:", error);
      
      if (error instanceof RequestError) {
        toast({
          variant: 'destructive',
          title: "خطأ في الحذف",
          description: error.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: "خطأ في الحذف",
          description: "لم نتمكن من حذف الطلب"
        });
      }
    } finally {
      setSyncing(false);
    }
  };

  const refreshData = useCallback(async () => {
    await syncData();
  }, [user]);

  return (
    <EnhancedRequestsContext.Provider 
      value={{ 
        requests,
        userRequests,
        addRequest,
        updateRequestStatus,
        deleteRequest,
        statistics,
        loading,
        syncing,
        connectionStatus,
        lastSyncTime,
        refreshData
      }}
    >
      {children}
      
      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        {connectionStatus === 'offline' && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm">وضع عدم الاتصال</span>
          </div>
        )}
        {connectionStatus === 'syncing' && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm">جاري المزامنة...</span>
          </div>
        )}
        {connectionStatus === 'online' && syncing && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm">جاري الحفظ...</span>
          </div>
        )}
      </div>
    </EnhancedRequestsContext.Provider>
  );
}

export function useEnhancedRequests() {
  const context = useContext(EnhancedRequestsContext);
  if (context === undefined) {
    throw new Error('useEnhancedRequests must be used within an EnhancedRequestsProvider');
  }
  return context;
}