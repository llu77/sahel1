"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { ExtendedRequest, RequestStatus } from '@/lib/types';
import { getRequests, createRequest, setRequestStatus } from '@/services/requests';
import { useToast } from "@/hooks/use-toast";

interface RequestsContextType {
  requests: ExtendedRequest[];
  addRequest: (request: Omit<ExtendedRequest, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  updateRequestStatus: (requestId: string, status: RequestStatus, reviewNotes: string) => Promise<void>;
  loading: boolean;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);


export function RequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ExtendedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        const requestsData = await getRequests();
        setRequests(requestsData);
      } catch (error) {
        console.error("Failed to load requests:", error);
        toast({ variant: 'destructive', title: "خطأ في تحميل الطلبات", description: "لم نتمكن من تحميل البيانات من قاعدة البيانات." });
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [toast]);


  const addRequest = async (requestData: Omit<ExtendedRequest, 'id' | 'submittedAt' | 'status'>) => {
    try {
        const newRequest = await createRequest(requestData);
        setRequests(prev => [newRequest, ...prev]);
    } catch(error) {
        console.error("Failed to add request:", error);
        toast({ variant: 'destructive', title: "خطأ في إرسال الطلب", description: "لم نتمكن من حفظ البيانات في قاعدة البيانات." });
    }
  };

  const updateRequestStatus = async (requestId: string, status: RequestStatus, reviewNotes: string) => {
    try {
        await setRequestStatus(requestId, status, reviewNotes);
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status, reviewNotes } 
            : req
        ));
    } catch(error) {
        console.error("Failed to update request status:", error);
        toast({ variant: 'destructive', title: "خطأ في تحديث الطلب", description: "لم نتمكن من تحديث البيانات في قاعدة البيانات." });
    }
  };

  return (
    <RequestsContext.Provider value={{ requests, addRequest, updateRequestStatus, loading }}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestsContext);
  if (context === undefined) {
    throw new Error('useRequests must be used within a RequestsProvider');
  }
  return context;
}
