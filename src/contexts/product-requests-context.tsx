
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { ProductRequest } from '@/lib/types';
import { getProductRequests, createProductRequest } from '@/services/product-requests';
import { useToast } from "@/hooks/use-toast";

interface ProductRequestsContextType {
  productRequests: ProductRequest[];
  addProductRequest: (request: Omit<ProductRequest, 'id'>) => Promise<ProductRequest | undefined>;
  loading: boolean;
}

const ProductRequestsContext = createContext<ProductRequestsContextType | undefined>(undefined);

export function ProductRequestsProvider({ children }: { children: ReactNode }) {
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        const requestsData = await getProductRequests();
        setProductRequests(requestsData);
      } catch (error) {
        console.error("Failed to load product requests:", error);
        toast({ variant: 'destructive', title: "خطأ في تحميل طلبات المنتجات" });
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [toast]);

  const addProductRequest = async (requestData: Omit<ProductRequest, 'id'>): Promise<ProductRequest | undefined> => {
    try {
      const newRequest = await createProductRequest(requestData);
      setProductRequests(prev => [newRequest, ...prev]);
      return newRequest;
    } catch(error) {
      console.error("Failed to add product request:", error);
      toast({ variant: 'destructive', title: "خطأ في إرسال طلب المنتجات" });
      return undefined;
    }
  };

  return (
    <ProductRequestsContext.Provider value={{ productRequests, addProductRequest, loading }}>
      {children}
    </ProductRequestsContext.Provider>
  );
}

export function useProductRequests() {
  const context = useContext(ProductRequestsContext);
  if (context === undefined) {
    throw new Error('useProductRequests must be used within a ProductRequestsProvider');
  }
  return context;
}
