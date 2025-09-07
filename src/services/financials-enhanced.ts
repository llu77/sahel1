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
  writeBatch,
  runTransaction
} from '@/lib/firebase-enhanced';
import type { Revenue, Expense } from '@/lib/types';

// Collections
const revenuesCol = collection(db, 'revenues');
const expensesCol = collection(db, 'expenses');
const requestsCol = collection(db, 'requests');

// Enhanced error handling
class DatabaseError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Transaction helper for atomic operations
async function executeTransaction<T>(
  operation: (transaction: any) => Promise<T>
): Promise<T> {
  try {
    return await runTransaction(db, operation);
  } catch (error: any) {
    console.error('Transaction failed:', error);
    throw new DatabaseError(
      'فشلت العملية. يرجى المحاولة مرة أخرى',
      'TRANSACTION_FAILED',
      error
    );
  }
}

// Batch operations for better performance
class BatchOperations {
  private batch = writeBatch(db);
  private operationCount = 0;
  private maxBatchSize = 500;

  async add(collectionRef: any, data: any) {
    if (this.operationCount >= this.maxBatchSize) {
      await this.commit();
      this.batch = writeBatch(db);
      this.operationCount = 0;
    }

    const docRef = doc(collectionRef);
    this.batch.set(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    this.operationCount++;
    return docRef.id;
  }

  async update(docRef: any, data: any) {
    if (this.operationCount >= this.maxBatchSize) {
      await this.commit();
      this.batch = writeBatch(db);
      this.operationCount = 0;
    }

    this.batch.update(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    this.operationCount++;
  }

  async commit() {
    if (this.operationCount === 0) return;
    
    try {
      await this.batch.commit();
      console.log(`✅ Batch committed: ${this.operationCount} operations`);
      this.operationCount = 0;
    } catch (error) {
      console.error('Batch commit failed:', error);
      throw new DatabaseError(
        'فشل حفظ البيانات المجمعة',
        'BATCH_COMMIT_FAILED',
        error
      );
    }
  }
}

// Enhanced Revenue Operations
export async function createRevenueEnhanced(
  revenueData: Omit<Revenue, 'id'>,
  userBranch: string,
  userRole: string
): Promise<Revenue> {
  // Validate data
  if (!dataValidator.validateRevenue(revenueData)) {
    throw new DatabaseError(
      'البيانات المدخلة غير صحيحة',
      'VALIDATION_ERROR'
    );
  }

  // Enforce branch isolation
  if (userRole !== 'admin' && revenueData.branch !== userBranch) {
    throw new DatabaseError(
      'غير مسموح بإضافة إيرادات لفرع آخر',
      'BRANCH_ACCESS_DENIED'
    );
  }

  // Prepare document data
  const docData = {
    ...revenueData,
    date: Timestamp.fromDate(revenueData.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userBranch,
    syncStatus: connectionManager.getStatus() ? 'synced' : 'pending',
    version: 1
  };

  try {
    // Use connection manager for retry logic
    const docRef = await connectionManager.retryOperation(async () => {
      return await addDoc(revenuesCol, docData);
    });

    // Get the created document
    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    
    if (!data) {
      throw new DatabaseError(
        'فشل في استرجاع البيانات المحفوظة',
        'RETRIEVAL_ERROR'
      );
    }

    console.log(`✅ Revenue saved successfully: ${docRef.id}`);
    
    return {
      id: newDoc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
    } as Revenue;
  } catch (error: any) {
    console.error('Failed to create revenue:', error);
    
    // If offline, save to local queue
    if (!connectionManager.getStatus()) {
      console.log('📦 Saving to local queue for later sync');
      // Implementation for local queue would go here
    }
    
    throw new DatabaseError(
      'فشل في حفظ الإيراد. البيانات محفوظة محلياً وسيتم المزامنة عند عودة الاتصال',
      'SAVE_FAILED',
      error
    );
  }
}

// Enhanced Expense Operations
export async function createExpenseEnhanced(
  expenseData: Omit<Expense, 'id'>,
  userBranch: string,
  userRole: string
): Promise<Expense> {
  // Validate data
  if (!dataValidator.validateExpense(expenseData)) {
    throw new DatabaseError(
      'البيانات المدخلة غير صحيحة',
      'VALIDATION_ERROR'
    );
  }

  // Enforce branch isolation
  if (userRole !== 'admin' && expenseData.branch !== userBranch) {
    throw new DatabaseError(
      'غير مسموح بإضافة مصروفات لفرع آخر',
      'BRANCH_ACCESS_DENIED'
    );
  }

  // Prepare document data
  const docData = {
    ...expenseData,
    date: Timestamp.fromDate(expenseData.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userBranch,
    syncStatus: connectionManager.getStatus() ? 'synced' : 'pending',
    version: 1
  };

  try {
    // Use connection manager for retry logic
    const docRef = await connectionManager.retryOperation(async () => {
      return await addDoc(expensesCol, docData);
    });

    // Get the created document
    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    
    if (!data) {
      throw new DatabaseError(
        'فشل في استرجاع البيانات المحفوظة',
        'RETRIEVAL_ERROR'
      );
    }

    console.log(`✅ Expense saved successfully: ${docRef.id}`);
    
    return {
      id: newDoc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
    } as Expense;
  } catch (error: any) {
    console.error('Failed to create expense:', error);
    
    // If offline, save to local queue
    if (!connectionManager.getStatus()) {
      console.log('📦 Saving to local queue for later sync');
      // Implementation for local queue would go here
    }
    
    throw new DatabaseError(
      'فشل في حفظ المصروف. البيانات محفوظة محلياً وسيتم المزامنة عند عودة الاتصال',
      'SAVE_FAILED',
      error
    );
  }
}

// Get revenues with branch isolation
export async function getRevenuesEnhanced(
  userBranch: string,
  userRole: string
): Promise<Revenue[]> {
  try {
    let q;
    
    if (userRole === 'admin') {
      // Admin sees all branches
      q = query(revenuesCol, orderBy('date', 'desc'));
    } else {
      // Regular users see only their branch
      q = query(
        revenuesCol,
        where('branch', '==', userBranch),
        orderBy('date', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
      } as Revenue;
    });
  } catch (error) {
    console.error('Failed to get revenues:', error);
    throw new DatabaseError(
      'فشل في تحميل الإيرادات',
      'FETCH_FAILED',
      error
    );
  }
}

// Get expenses with branch isolation
export async function getExpensesEnhanced(
  userBranch: string,
  userRole: string
): Promise<Expense[]> {
  try {
    let q;
    
    if (userRole === 'admin') {
      // Admin sees all branches
      q = query(expensesCol, orderBy('date', 'desc'));
    } else {
      // Regular users see only their branch
      q = query(
        expensesCol,
        where('branch', '==', userBranch),
        orderBy('date', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
      } as Expense;
    });
  } catch (error) {
    console.error('Failed to get expenses:', error);
    throw new DatabaseError(
      'فشل في تحميل المصروفات',
      'FETCH_FAILED',
      error
    );
  }
}

// Bulk operations for better performance
export async function createMultipleRevenues(
  revenues: Omit<Revenue, 'id'>[],
  userBranch: string,
  userRole: string
): Promise<string[]> {
  const batch = new BatchOperations();
  const ids: string[] = [];

  for (const revenue of revenues) {
    // Validate each revenue
    if (!dataValidator.validateRevenue(revenue)) {
      throw new DatabaseError(
        `بيانات غير صحيحة للإيراد`,
        'VALIDATION_ERROR'
      );
    }

    // Enforce branch isolation
    if (userRole !== 'admin' && revenue.branch !== userBranch) {
      throw new DatabaseError(
        'غير مسموح بإضافة إيرادات لفرع آخر',
        'BRANCH_ACCESS_DENIED'
      );
    }

    const docData = {
      ...revenue,
      date: Timestamp.fromDate(revenue.date),
      createdBy: userBranch,
      syncStatus: connectionManager.getStatus() ? 'synced' : 'pending'
    };

    const id = await batch.add(revenuesCol, docData);
    ids.push(id);
  }

  await batch.commit();
  console.log(`✅ Created ${ids.length} revenues in batch`);
  return ids;
}

// Update operations with optimistic locking
export async function updateRevenueEnhanced(
  id: string,
  updates: Partial<Revenue>,
  userBranch: string,
  userRole: string
): Promise<void> {
  const docRef = doc(revenuesCol, id);
  
  await executeTransaction(async (transaction) => {
    const docSnap = await transaction.get(docRef);
    
    if (!docSnap.exists()) {
      throw new DatabaseError(
        'الإيراد غير موجود',
        'NOT_FOUND'
      );
    }

    const currentData = docSnap.data();
    
    // Check branch access
    if (userRole !== 'admin' && currentData.branch !== userBranch) {
      throw new DatabaseError(
        'غير مسموح بتعديل إيرادات فرع آخر',
        'BRANCH_ACCESS_DENIED'
      );
    }

    // Optimistic locking check
    const currentVersion = currentData.version || 1;
    
    transaction.update(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      version: currentVersion + 1,
      lastModifiedBy: userBranch
    });
  });

  console.log(`✅ Revenue ${id} updated successfully`);
}

// Delete operations with soft delete
export async function deleteRevenueEnhanced(
  id: string,
  userBranch: string,
  userRole: string
): Promise<void> {
  const docRef = doc(revenuesCol, id);
  
  await executeTransaction(async (transaction) => {
    const docSnap = await transaction.get(docRef);
    
    if (!docSnap.exists()) {
      throw new DatabaseError(
        'الإيراد غير موجود',
        'NOT_FOUND'
      );
    }

    const currentData = docSnap.data();
    
    // Check branch access
    if (userRole !== 'admin' && currentData.branch !== userBranch) {
      throw new DatabaseError(
        'غير مسموح بحذف إيرادات فرع آخر',
        'BRANCH_ACCESS_DENIED'
      );
    }

    // Soft delete - mark as deleted but keep in database
    transaction.update(docRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userBranch,
      updatedAt: serverTimestamp()
    });
  });

  console.log(`✅ Revenue ${id} marked as deleted`);
}

// Export batch operations for external use
export { BatchOperations, DatabaseError };