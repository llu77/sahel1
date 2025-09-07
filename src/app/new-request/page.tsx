
"use client";

import React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { useRequests } from "@/contexts/requests-context";
import { RequestForm } from "@/components/request-form";
import type { SahlRequest, ExtendedRequest } from "@/lib/types";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

export default function NewRequestPage() {
    const { user } = useAuth();
    const { addRequest } = useRequests();
    const router = useRouter();
    const { toast } = useToast();

    const handleAddRequest = (requestData: Omit<SahlRequest, 'id' | 'submittedAt' | 'status'>) => {
        if (!user) return;
        
        const newRequest: Omit<ExtendedRequest, 'id' | 'submittedAt' | 'status'> = {
            ...requestData,
            userId: user.email,
            employeeName: user.name,
            branch: user.branch,
        }
        addRequest(newRequest);
        toast({
            title: "تم إرسال الطلب بنجاح!",
            description: "يمكنك متابعة حالة طلبك من صفحة طلباتي.",
        });
        router.push('/my-requests');
    };

    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-2xl">
                <RequestForm onSubmit={handleAddRequest} />
            </div>
        </div>
    );
}
