
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/auth-context";
import { ProductRequestForm, type FormValues } from "@/components/product-request-form";
import type { ProductRequest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useProductRequests } from '@/contexts/product-requests-context';
import { ProductRequestInvoice } from '@/components/product-request-invoice';
import { ProductRequestList } from '@/components/product-request-list';
import { useReactToPrint } from 'react-to-print';


export default function ProductRequestsPage() {
    const { user } = useAuth();
    const { productRequests, addProductRequest } = useProductRequests();
    const { toast } = useToast();
    const [submittedRequest, setSubmittedRequest] = useState<ProductRequest | null>(null);
    const [requestToPrint, setRequestToPrint] = useState<ProductRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const invoiceRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => invoiceRef.current,
        documentTitle: `فاتورة-طلب-${requestToPrint?.id || ''}`,
        onAfterPrint: () => setRequestToPrint(null),
    });

    useEffect(() => {
        if (requestToPrint && invoiceRef.current) {
            handlePrint();
        }
    }, [requestToPrint, handlePrint]);
    
    const handleAddRequest = async (formData: FormValues) => {
        if (!user) return;
        
        setIsSubmitting(true);
        setSubmittedRequest(null);
        try {
            const grandTotal = formData.items.reduce((acc, item) => acc + (item.total || 0), 0);
            
            const newRequestData: Omit<ProductRequest, 'id'> = {
                ...formData,
                grandTotal,
                userId: user.email,
                employeeName: user.name,
            };

            const createdRequest = await addProductRequest(newRequestData);

            if (createdRequest) {
                setSubmittedRequest(createdRequest);
                toast({
                    title: "تم حفظ الطلب بنجاح!",
                    description: "يمكنك الآن طباعة الفاتورة.",
                });
            } else {
                throw new Error("Failed to create request.");
            }
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "خطأ في إرسال الطلب",
                description: "حدث خطأ أثناء محاولة حفظ الطلب. يرجى المحاولة مرة أخرى.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const triggerPrint = useCallback((request: ProductRequest) => {
      setRequestToPrint(request);
    }, []);

    const handlePrintSubmittedRequest = () => {
        if (submittedRequest) {
            triggerPrint(submittedRequest);
        }
    };
    
    const recentRequests = productRequests.slice(0, 10);

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-headline font-bold">طلبات المنتجات</h1>
            </div>
            <div className="mx-auto max-w-4xl space-y-8">
                <ProductRequestForm 
                    key={submittedRequest?.id} 
                    onSubmit={handleAddRequest} 
                    isSubmitting={isSubmitting}
                    onPrint={handlePrintSubmittedRequest}
                    isPrintable={!!submittedRequest && !isSubmitting}
                />
                <ProductRequestList 
                  requests={recentRequests} 
                  onPrintRequest={triggerPrint}
                />
            </div>
            <div className="hidden">
            {requestToPrint && <ProductRequestInvoice ref={invoiceRef} request={requestToPrint} />}
            </div>
        </>
    );
}
