
import type { ProductRequest } from '@/lib/types';

export async function getProductRequests(): Promise<ProductRequest[]> {
    try {
        const response = await fetch('/api/product-requests', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Convert date strings back to Date objects and map to ProductRequest format
        return data.map((item: any) => ({
            id: item.id,
            requestNumber: item.requestNumber,
            requestDate: new Date(item.date || item.created_at),
            branch: item.branch,
            employeeName: item.employeeName,
            userId: item.userId || '',
            items: item.products || item.items || [],
            grandTotal: item.totalPrice || item.grandTotal || 0,
            notes: item.notes || '',
            status: item.status || 'pending'
        })) as ProductRequest[];
    } catch (error) {
        console.error('Error fetching product requests:', error);
        throw error;
    }
}

export async function createProductRequest(requestData: Omit<ProductRequest, 'id'>): Promise<ProductRequest> {
    try {
        const response = await fetch('/api/product-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: requestData.requestDate.toISOString(),
                branch: requestData.branch,
                employeeName: requestData.employeeName,
                userId: requestData.userId,
                products: requestData.items,
                totalQuantity: requestData.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
                totalPrice: requestData.grandTotal,
                notes: requestData.notes,
                status: requestData.status || 'pending'
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const createdData = await response.json();
        
        // Convert response back to ProductRequest format
        return {
            id: createdData.id,
            requestNumber: createdData.requestNumber,
            requestDate: new Date(createdData.date),
            branch: createdData.branch,
            employeeName: createdData.employeeName,
            userId: createdData.userId || requestData.userId,
            items: createdData.products || [],
            grandTotal: createdData.totalPrice,
            notes: createdData.notes || '',
            status: createdData.status
        } as ProductRequest;
    } catch (error) {
        console.error('Error creating product request:', error);
        throw error;
    }
}

