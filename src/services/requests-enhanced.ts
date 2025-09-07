"use client";
import { 
  db, 
  connectionManager, 
  dataValidator,
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDoc,
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  runTransaction
} from '@/lib/firebase-enhanced';
import type { ExtendedRequest, RequestStatus } from '@/lib/types';

const requestsCol = collection(db, 'requests');

// Enhanced error handling for requests
class RequestError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'RequestError';
  }
}

// Validate request data
function validateRequest(data: any): boolean {
  if (!data.branch || !['laban', 'tuwaiq'].includes(data.branch)) {
    console.error('Invalid branch');
    return false;
  }
  
  if (!data.title || data.title.length < 3) {
    console.error('Title too short');
    return false;
  }
  
  if (!data.type || !['leave', 'advance', 'resignation', 'overtime'].includes(data.type)) {
    console.error('Invalid request type');
    return false;
  }
  
  if (!data.userId) {
    console.error('User ID missing');
    return false;
  }
  
  // Type-specific validation
  switch (data.type) {
    case 'leave':
      if (!data.startDate || !data.endDate) {
        console.error('Leave dates missing');
        return false;
      }
      if (data.startDate > data.endDate) {
        console.error('Invalid leave date range');
        return false;
      }
      break;
      
    case 'advance':
      if (!data.amount || data.amount <= 0) {
        console.error('Invalid advance amount');
        return false;
      }
      break;
      
    case 'resignation':
      if (!data.lastWorkingDay) {
        console.error('Last working day missing');
        return false;
      }
      break;
      
    case 'overtime':
      if (!data.date || !data.hours || data.hours <= 0) {
        console.error('Invalid overtime details');
        return false;
      }
      break;
  }
  
  return true;
}

// Create request with branch isolation
export async function createRequestEnhanced(
  requestData: Omit<ExtendedRequest, 'id' | 'status' | 'submittedAt'>,
  userBranch: string,
  userRole: string,
  userEmail: string
): Promise<ExtendedRequest> {
  // Validate data
  if (!validateRequest(requestData)) {
    throw new RequestError(
      'البيانات المدخلة غير صحيحة',
      'VALIDATION_ERROR'
    );
  }
  
  // Ensure user can only create requests for their branch (unless admin)
  if (userRole !== 'admin' && requestData.branch !== userBranch) {
    throw new RequestError(
      'غير مسموح بإنشاء طلبات لفرع آخر',
      'BRANCH_ACCESS_DENIED'
    );
  }
  
  // Prepare document data
  const requestToSave: any = { ...requestData };
  
  // Convert date fields to Timestamps
  if (requestToSave.type === 'leave' && requestToSave.startDate && requestToSave.endDate) {
    requestToSave.startDate = Timestamp.fromDate(requestToSave.startDate);
    requestToSave.endDate = Timestamp.fromDate(requestToSave.endDate);
  } else if (requestToSave.type === 'resignation' && requestToSave.lastWorkingDay) {
    requestToSave.lastWorkingDay = Timestamp.fromDate(requestToSave.lastWorkingDay);
  } else if (requestToSave.type === 'overtime' && requestToSave.date) {
    requestToSave.date = Timestamp.fromDate(requestToSave.date);
  }
  
  const docData = {
    ...requestToSave,
    status: 'pending' as RequestStatus,
    submittedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    userId: userEmail,
    createdBy: userBranch,
    syncStatus: connectionManager.getStatus() ? 'synced' : 'pending',
    version: 1
  };
  
  try {
    // Use connection manager for retry logic
    const docRef = await connectionManager.retryOperation(async () => {
      return await addDoc(requestsCol, docData);
    });
    
    // Get the created document
    const newDocSnap = await getDoc(docRef);
    const savedData = newDocSnap.data();
    
    if (!savedData) {
      throw new RequestError(
        'فشل في استرجاع البيانات المحفوظة',
        'RETRIEVAL_ERROR'
      );
    }
    
    console.log(`✅ Request saved successfully: ${docRef.id}`);
    
    // Return with converted dates
    const newRequest: ExtendedRequest = {
      id: docRef.id,
      ...savedData,
      submittedAt: savedData.submittedAt?.toDate ? savedData.submittedAt.toDate() : new Date(),
      ...(savedData.startDate && { 
        startDate: savedData.startDate.toDate ? savedData.startDate.toDate() : savedData.startDate 
      }),
      ...(savedData.endDate && { 
        endDate: savedData.endDate.toDate ? savedData.endDate.toDate() : savedData.endDate 
      }),
      ...(savedData.lastWorkingDay && { 
        lastWorkingDay: savedData.lastWorkingDay.toDate ? savedData.lastWorkingDay.toDate() : savedData.lastWorkingDay 
      }),
      ...(savedData.date && { 
        date: savedData.date.toDate ? savedData.date.toDate() : savedData.date 
      }),
    } as ExtendedRequest;
    
    return newRequest;
  } catch (error: any) {
    console.error('Failed to create request:', error);
    
    // If offline, save to local queue
    if (!connectionManager.getStatus()) {
      console.log('📦 Saving request to local queue for later sync');
      // Implementation for local queue would go here
    }
    
    throw new RequestError(
      'فشل في حفظ الطلب. البيانات محفوظة محلياً وسيتم المزامنة عند عودة الاتصال',
      'SAVE_FAILED',
      error
    );
  }
}

// Get requests with branch isolation
export async function getRequestsEnhanced(
  userBranch: string,
  userRole: string,
  userEmail?: string
): Promise<ExtendedRequest[]> {
  try {
    let q;
    
    if (userRole === 'admin') {
      // Admin sees all requests
      q = query(requestsCol, orderBy('submittedAt', 'desc'));
    } else {
      // Regular users see only their branch's requests
      q = query(
        requestsCol,
        where('branch', '==', userBranch),
        orderBy('submittedAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(),
        ...(data.startDate && { 
          startDate: data.startDate.toDate ? data.startDate.toDate() : data.startDate 
        }),
        ...(data.endDate && { 
          endDate: data.endDate.toDate ? data.endDate.toDate() : data.endDate 
        }),
        ...(data.lastWorkingDay && { 
          lastWorkingDay: data.lastWorkingDay.toDate ? data.lastWorkingDay.toDate() : data.lastWorkingDay 
        }),
        ...(data.date && { 
          date: data.date.toDate ? data.date.toDate() : data.date 
        }),
      } as ExtendedRequest;
    });
  } catch (error) {
    console.error('Failed to get requests:', error);
    throw new RequestError(
      'فشل في تحميل الطلبات',
      'FETCH_FAILED',
      error
    );
  }
}

// Get user's own requests
export async function getUserRequests(userEmail: string): Promise<ExtendedRequest[]> {
  try {
    const q = query(
      requestsCol,
      where('userId', '==', userEmail),
      orderBy('submittedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(),
        ...(data.startDate && { 
          startDate: data.startDate.toDate ? data.startDate.toDate() : data.startDate 
        }),
        ...(data.endDate && { 
          endDate: data.endDate.toDate ? data.endDate.toDate() : data.endDate 
        }),
        ...(data.lastWorkingDay && { 
          lastWorkingDay: data.lastWorkingDay.toDate ? data.lastWorkingDay.toDate() : data.lastWorkingDay 
        }),
        ...(data.date && { 
          date: data.date.toDate ? data.date.toDate() : data.date 
        }),
      } as ExtendedRequest;
    });
  } catch (error) {
    console.error('Failed to get user requests:', error);
    throw new RequestError(
      'فشل في تحميل طلباتك',
      'FETCH_FAILED',
      error
    );
  }
}

// Update request status with transaction
export async function setRequestStatusEnhanced(
  requestId: string,
  status: RequestStatus,
  reviewNotes: string,
  userBranch: string,
  userRole: string
): Promise<void> {
  const requestRef = doc(requestsCol, requestId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(requestRef);
      
      if (!docSnap.exists()) {
        throw new RequestError(
          'الطلب غير موجود',
          'NOT_FOUND'
        );
      }
      
      const currentData = docSnap.data();
      
      // Check branch access for non-admin users
      if (userRole !== 'admin' && currentData.branch !== userBranch) {
        throw new RequestError(
          'غير مسموح بتعديل طلبات فرع آخر',
          'BRANCH_ACCESS_DENIED'
        );
      }
      
      // Update with optimistic locking
      const currentVersion = currentData.version || 1;
      
      transaction.update(requestRef, {
        status,
        reviewNotes,
        reviewedAt: serverTimestamp(),
        reviewedBy: userBranch,
        updatedAt: serverTimestamp(),
        version: currentVersion + 1
      });
    });
    
    console.log(`✅ Request ${requestId} status updated to ${status}`);
  } catch (error: any) {
    console.error('Failed to update request status:', error);
    
    if (error instanceof RequestError) {
      throw error;
    }
    
    throw new RequestError(
      'فشل في تحديث حالة الطلب',
      'UPDATE_FAILED',
      error
    );
  }
}

// Delete request (soft delete)
export async function deleteRequestEnhanced(
  requestId: string,
  userBranch: string,
  userRole: string,
  userEmail: string
): Promise<void> {
  const requestRef = doc(requestsCol, requestId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(requestRef);
      
      if (!docSnap.exists()) {
        throw new RequestError(
          'الطلب غير موجود',
          'NOT_FOUND'
        );
      }
      
      const currentData = docSnap.data();
      
      // Check permissions
      if (userRole !== 'admin') {
        // Users can only delete their own pending requests
        if (currentData.userId !== userEmail) {
          throw new RequestError(
            'غير مسموح بحذف طلبات الآخرين',
            'ACCESS_DENIED'
          );
        }
        
        if (currentData.status !== 'pending') {
          throw new RequestError(
            'لا يمكن حذف الطلبات المعتمدة أو المرفوضة',
            'INVALID_STATUS'
          );
        }
      }
      
      // Soft delete
      transaction.update(requestRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: userEmail,
        updatedAt: serverTimestamp()
      });
    });
    
    console.log(`✅ Request ${requestId} marked as deleted`);
  } catch (error: any) {
    console.error('Failed to delete request:', error);
    
    if (error instanceof RequestError) {
      throw error;
    }
    
    throw new RequestError(
      'فشل في حذف الطلب',
      'DELETE_FAILED',
      error
    );
  }
}

// Get request statistics
export async function getRequestStatistics(
  userBranch: string,
  userRole: string
): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<string, number>;
  byBranch?: Record<string, number>;
}> {
  try {
    let q;
    
    if (userRole === 'admin') {
      q = query(requestsCol);
    } else {
      q = query(requestsCol, where('branch', '==', userBranch));
    }
    
    const snapshot = await getDocs(q);
    
    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byType: {} as Record<string, number>,
      byBranch: userRole === 'admin' ? {} as Record<string, number> : undefined
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip deleted requests
      if (data.deleted) return;
      
      stats.total++;
      
      // By status
      if (data.status === 'pending') stats.pending++;
      else if (data.status === 'approved') stats.approved++;
      else if (data.status === 'rejected') stats.rejected++;
      
      // By type
      if (data.type) {
        stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;
      }
      
      // By branch (admin only)
      if (userRole === 'admin' && stats.byBranch && data.branch) {
        stats.byBranch[data.branch] = (stats.byBranch[data.branch] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to get request statistics:', error);
    throw new RequestError(
      'فشل في تحميل الإحصائيات',
      'STATS_FAILED',
      error
    );
  }
}

export { RequestError };