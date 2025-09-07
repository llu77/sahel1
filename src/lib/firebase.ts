// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "sahl-request",
  "appId": "1:52750699211:web:5aaa5b5a3165ba79ec294e",
  "storageBucket": "sahl-request.firebasestorage.app",
  "apiKey": "AIzaSyCbt8JxFHzlLs34drqEjkD2c2e7XWEmP4M",
  "authDomain": "sahl-request.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "52750699211"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize App Check (disabled for now to avoid ReCAPTCHA errors)
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

const db = getFirestore(app);

export { app, db };
