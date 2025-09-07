// Enhanced Firebase Configuration with Real-time Sync and Branch Isolation
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  enableIndexedDbPersistence
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Firebase configuration
const firebaseConfig = {
  "projectId": "sahl-request",
  "appId": "1:52750699211:web:5aaa5b5a3165ba79ec294e",
  "storageBucket": "sahl-request.firebasestorage.app",
  "apiKey": "AIzaSyCbt8JxFHzlLs34drqEjkD2c2e7XWEmP4M",
  "authDomain": "sahl-request.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "52750699211"
};

// Initialize Firebase with optimized settings
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistence and multi-tab support
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize App Check for security (disabled for now to avoid ReCAPTCHA errors)
// To enable App Check:
// 1. Go to Firebase Console > App Check
// 2. Register your app and get a valid ReCAPTCHA site key
// 3. Replace the key below and uncomment the code
/*
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR-RECAPTCHA-SITE-KEY'),
    isTokenAutoRefreshEnabled: true
  });
}
*/

// For local development without App Check
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Connection state manager
class ConnectionManager {
  private static instance: ConnectionManager;
  private isOnline: boolean = true;
  private listeners: Set<(status: boolean) => void> = new Set();
  private retryAttempts = 0;
  private maxRetries = 5;
  private retryDelay = 1000;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Monitor online/offline status
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Check initial connection state
      this.isOnline = navigator.onLine;
      
      // Periodic connection check
      setInterval(() => this.checkConnection(), 30000); // Every 30 seconds
    }
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  private async handleOnline() {
    console.log('🟢 Connection restored');
    this.isOnline = true;
    this.retryAttempts = 0;
    
    try {
      await enableNetwork(db);
      this.notifyListeners(true);
    } catch (error) {
      console.error('Error enabling network:', error);
    }
  }

  private async handleOffline() {
    console.log('🔴 Connection lost - switching to offline mode');
    this.isOnline = false;
    this.notifyListeners(false);
    
    // Firestore will automatically use cached data
    // No need to explicitly disable network
  }

  private async checkConnection() {
    if (!this.isOnline && navigator.onLine) {
      await this.handleOnline();
    } else if (this.isOnline && !navigator.onLine) {
      await this.handleOffline();
    }
  }

  private notifyListeners(status: boolean) {
    this.listeners.forEach(listener => listener(status));
  }

  public addListener(listener: (status: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
        console.log(`⚠️ Operation failed, retrying in ${delay}ms... (Attempt ${this.retryAttempts}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryOperation(operation);
      }
      
      this.retryAttempts = 0;
      throw error;
    }
  }
}

// Real-time sync manager for branch isolation
class BranchSyncManager {
  private static instance: BranchSyncManager;
  private subscriptions: Map<string, () => void> = new Map();
  private connectionManager: ConnectionManager;

  private constructor() {
    this.connectionManager = ConnectionManager.getInstance();
  }

  static getInstance(): BranchSyncManager {
    if (!BranchSyncManager.instance) {
      BranchSyncManager.instance = new BranchSyncManager();
    }
    return BranchSyncManager.instance;
  }

  public subscribeToBranch(
    collectionName: string,
    branch: string,
    onUpdate: (data: any[]) => void,
    includeAllBranches: boolean = false
  ) {
    const subscriptionKey = `${collectionName}-${branch}`;
    
    // Unsubscribe from previous subscription if exists
    if (this.subscriptions.has(subscriptionKey)) {
      const unsubscribe = this.subscriptions.get(subscriptionKey);
      if (unsubscribe) unsubscribe();
    }

    // Create query based on branch isolation
    const collectionRef = collection(db, collectionName);
    let queryRef;

    if (includeAllBranches || branch === 'admin') {
      // Admin sees all branches
      queryRef = query(collectionRef, orderBy('date', 'desc'));
    } else {
      // Regular users see only their branch
      queryRef = query(
        collectionRef,
        where('branch', '==', branch),
        orderBy('date', 'desc')
      );
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      queryRef,
      {
        includeMetadataChanges: true // Include metadata changes for better sync
      },
      (snapshot: QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamp to Date
          date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date
        }));

        // Check if data is from cache or server
        const source = snapshot.metadata.fromCache ? '📦 Cache' : '☁️ Server';
        console.log(`Data loaded from ${source} for ${collectionName} - ${branch}`);

        onUpdate(data);

        // Show sync status to user
        if (snapshot.metadata.hasPendingWrites) {
          console.log('⏳ Syncing local changes...');
        }
      },
      (error) => {
        console.error(`Error in real-time sync for ${collectionName}:`, error);
        // Attempt to reconnect after error
        setTimeout(() => {
          this.subscribeToBranch(collectionName, branch, onUpdate, includeAllBranches);
        }, 5000);
      }
    );

    this.subscriptions.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  }

  public unsubscribeAll() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}

// Data validation helper
class DataValidator {
  static validateRevenue(data: any): boolean {
    if (!data.totalAmount || data.totalAmount <= 0) return false;
    if (!data.branch || !['laban', 'tuwaiq'].includes(data.branch)) return false;
    if (!data.date) return false;
    if (!data.employeeContributions || !Array.isArray(data.employeeContributions)) return false;
    
    // Validate payment amounts match
    const paymentSum = (data.cashAmount || 0) + (data.networkAmount || 0);
    const tolerance = 0.01; // Allow small rounding differences
    if (Math.abs(paymentSum - data.totalAmount) > tolerance) {
      if (!data.mismatchReason || data.mismatchReason.length < 10) {
        console.error('Payment mismatch without valid reason');
        return false;
      }
    }
    
    // Validate employee contributions sum
    const contributionSum = data.employeeContributions.reduce(
      (sum: number, emp: any) => sum + (emp.amount || 0), 0
    );
    if (Math.abs(contributionSum - data.totalAmount) > tolerance) {
      console.error('Employee contributions do not match total amount');
      return false;
    }
    
    return true;
  }

  static validateExpense(data: any): boolean {
    if (!data.amount || data.amount <= 0) return false;
    if (!data.branch || !['laban', 'tuwaiq'].includes(data.branch)) return false;
    if (!data.date) return false;
    if (!data.category) return false;
    if (!data.description || data.description.length < 5) return false;
    
    return true;
  }

  static validateRequest(data: any): boolean {
    if (!data.branch || !['laban', 'tuwaiq'].includes(data.branch)) return false;
    if (!data.date) return false;
    if (!data.title || data.title.length < 3) return false;
    if (!data.type) return false;
    
    return true;
  }
}

// Export instances and utilities
export { app, db };
export const connectionManager = ConnectionManager.getInstance();
export const branchSyncManager = BranchSyncManager.getInstance();
export const dataValidator = DataValidator;

// Export Firestore functions with proper imports
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction
} from "firebase/firestore";

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction,
  onSnapshot
};