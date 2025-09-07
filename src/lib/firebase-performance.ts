import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  enableNetwork,
  disableNetwork,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { app } from './firebase';

// Initialize Firestore with performance optimizations
export const optimizedDb = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: false,
  experimentalAutoDetectLongPolling: true
});

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(optimizedDb, {
    forceOwnership: true
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence');
    }
  });
}

// Cache management
class FirebaseCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes cache

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const firebaseCache = new FirebaseCache();

// Optimized query helpers
export async function optimizedQuery<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  cacheKey?: string
): Promise<T[]> {
  // Check cache first
  if (cacheKey) {
    const cached = firebaseCache.get(cacheKey);
    if (cached) return cached;
  }
  
  const q = query(collection(optimizedDb, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
  
  // Cache the result
  if (cacheKey) {
    firebaseCache.set(cacheKey, data);
  }
  
  return data;
}

// Batch operations for better performance
export class BatchOperations {
  private batch = writeBatch(optimizedDb);
  private operationCount = 0;
  private readonly MAX_BATCH_SIZE = 500;

  async add(collectionName: string, data: DocumentData): Promise<void> {
    const docRef = doc(collection(optimizedDb, collectionName));
    this.batch.set(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    this.operationCount++;
    
    if (this.operationCount >= this.MAX_BATCH_SIZE) {
      await this.commit();
      this.batch = writeBatch(optimizedDb);
      this.operationCount = 0;
    }
  }

  async update(collectionName: string, docId: string, data: DocumentData): Promise<void> {
    const docRef = doc(optimizedDb, collectionName, docId);
    this.batch.update(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    this.operationCount++;
    
    if (this.operationCount >= this.MAX_BATCH_SIZE) {
      await this.commit();
      this.batch = writeBatch(optimizedDb);
      this.operationCount = 0;
    }
  }

  async delete(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(optimizedDb, collectionName, docId);
    this.batch.delete(docRef);
    this.operationCount++;
    
    if (this.operationCount >= this.MAX_BATCH_SIZE) {
      await this.commit();
      this.batch = writeBatch(optimizedDb);
      this.operationCount = 0;
    }
  }

  async commit(): Promise<void> {
    if (this.operationCount > 0) {
      await this.batch.commit();
      this.operationCount = 0;
    }
  }
}

// Connection state management
export class ConnectionManager {
  private isOnline = true;
  
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }
  
  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    await enableNetwork(optimizedDb);
    console.log('Firebase: Back online');
  }
  
  private async handleOffline(): Promise<void> {
    this.isOnline = false;
    await disableNetwork(optimizedDb);
    console.log('Firebase: Working offline');
  }
  
  getStatus(): boolean {
    return this.isOnline;
  }
}

export const connectionManager = new ConnectionManager();

// Pagination helper for large datasets
export class PaginationHelper<T> {
  private lastDoc: any = null;
  private readonly pageSize: number;
  
  constructor(pageSize: number = 20) {
    this.pageSize = pageSize;
  }
  
  async getPage(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<{ data: T[]; hasMore: boolean }> {
    const baseConstraints = [...constraints, limit(this.pageSize + 1)];
    
    if (this.lastDoc) {
      baseConstraints.push(startAfter(this.lastDoc));
    }
    
    const q = query(collection(optimizedDb, collectionName), ...baseConstraints);
    const snapshot = await getDocs(q);
    
    const docs = snapshot.docs;
    const hasMore = docs.length > this.pageSize;
    
    if (hasMore) {
      docs.pop(); // Remove the extra document
    }
    
    if (docs.length > 0) {
      this.lastDoc = docs[docs.length - 1];
    }
    
    const data = docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
    
    return { data, hasMore };
  }
  
  reset(): void {
    this.lastDoc = null;
  }
}

// Add missing import
import { startAfter } from 'firebase/firestore';

// Export all utilities
export {
  optimizedDb as db,
  optimizedQuery,
  BatchOperations,
  ConnectionManager,
  PaginationHelper
};