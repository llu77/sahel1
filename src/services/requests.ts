import type { ExtendedRequest, RequestStatus, SahlRequest } from '@/lib/types';

export async function getRequests(): Promise<ExtendedRequest[]> {
    try {
        const response = await fetch('/api/employee-requests', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Convert date strings back to Date objects and map to ExtendedRequest format
        return data.map((item: any) => ({
            id: item.id,
            type: item.type,
            title: item.title || '',
            employeeName: item.employeeName,
            userId: item.userId,
            branch: item.branch,
            reason: item.reason || '',
            status: item.status,
            submittedAt: new Date(item.submittedAt || item.created_at),
            reviewNotes: item.reviewNotes || '',
            
            // Type-specific fields
            ...(item.startDate && { startDate: new Date(item.startDate) }),
            ...(item.endDate && { endDate: new Date(item.endDate) }),
            ...(item.amount && { amount: item.amount }),
            ...(item.lastWorkingDay && { lastWorkingDay: new Date(item.lastWorkingDay) }),
            ...(item.date && { date: new Date(item.date) }),
            ...(item.hours && { hours: item.hours })
        })) as ExtendedRequest[];
    } catch (error) {
        console.error('Error fetching employee requests:', error);
        throw error;
    }
}

export async function createRequest(requestData: Omit<ExtendedRequest, 'id' | 'status' | 'submittedAt'>): Promise<ExtendedRequest> {
    try {
        const payload: any = {
            type: requestData.type,
            title: requestData.title,
            employeeName: requestData.employeeName,
            userId: requestData.userId,
            branch: requestData.branch,
            reason: requestData.reason,
        };

        // Add type-specific fields
        if (requestData.type === 'leave' && requestData.startDate && requestData.endDate) {
            payload.startDate = requestData.startDate.toISOString();
            payload.endDate = requestData.endDate.toISOString();
        } else if (requestData.type === 'advance' && requestData.amount) {
            payload.amount = requestData.amount;
        } else if (requestData.type === 'resignation' && requestData.lastWorkingDay) {
            payload.lastWorkingDay = requestData.lastWorkingDay.toISOString();
        } else if (requestData.type === 'overtime' && requestData.date && requestData.hours) {
            payload.date = requestData.date.toISOString();
            payload.hours = requestData.hours;
        }

        const response = await fetch('/api/employee-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const createdData = await response.json();
        
        // Convert response back to ExtendedRequest format
        return {
            id: createdData.id,
            type: createdData.type,
            title: createdData.title || '',
            employeeName: createdData.employeeName,
            userId: createdData.userId,
            branch: createdData.branch,
            reason: createdData.reason || '',
            status: createdData.status,
            submittedAt: new Date(createdData.submittedAt),
            
            // Type-specific fields
            ...(createdData.startDate && { startDate: new Date(createdData.startDate) }),
            ...(createdData.endDate && { endDate: new Date(createdData.endDate) }),
            ...(createdData.amount && { amount: createdData.amount }),
            ...(createdData.lastWorkingDay && { lastWorkingDay: new Date(createdData.lastWorkingDay) }),
            ...(createdData.date && { date: new Date(createdData.date) }),
            ...(createdData.hours && { hours: createdData.hours })
        } as ExtendedRequest;
    } catch (error) {
        console.error('Error creating employee request:', error);
        throw error;
    }
}

export async function setRequestStatus(requestId: string, status: RequestStatus, reviewNotes: string): Promise<void> {
    try {
        const response = await fetch('/api/employee-requests', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: requestId,
                status,
                reviewNotes
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error updating request status:', error);
        throw error;
    }
}
