
"use client";

import React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { useRequests } from "@/contexts/requests-context";
import { RequestList } from "@/components/request-list";

export default function MyRequestsPage() {
    const { user } = useAuth();
    const { requests } = useRequests();

    const userRequests = React.useMemo(() => {
        if (!user) return [];
        return requests.filter(r => r.userId === user.email);
    }, [requests, user]);

    return (
        <>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-headline font-bold">طلباتي</h1>
                    <p className="text-muted-foreground mt-1">تتبع جميع طلباتك المقدمة وحالتها هنا.</p>
                </div>
            </div>
            <RequestList requests={userRequests} />
        </>
    );
}
