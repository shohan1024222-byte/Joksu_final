// Firebase Configuration for JOKSHU Voting App
// 
// ===================== সেটআপ নির্দেশনা =====================
// 
// 1. https://console.firebase.google.com/ এ যান
// 2. "Add project" ক্লিক করুন
// 3. Project name দিন (যেমন: "jokshu-voting")
// 4. Google Analytics বন্ধ করতে পারেন (দরকার নেই)
// 5. Project তৈরি হলে, Web app যোগ করুন (</> আইকন)
// 6. App nickname দিন এবং Register করুন
// 7. নিচের config values গুলো Firebase Console থেকে কপি করে বসান
// 8. Firebase Console > Firestore Database > Create Database
//    - "Start in test mode" সিলেক্ট করুন
//    - Location সিলেক্ট করুন (যেকোনো)
//    - Create ক্লিক করুন
//
// ============================================================

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// ⚠️ নিচের values গুলো Firebase Console থেকে তোমার নিজের project-এর values দিয়ে replace করো
const firebaseConfig = {
  apiKey: "AIzaSyCi-VNjzunF1Js1koymjtFZLjTVZH5tG-M",
  authDomain: "jokshu-voting.firebaseapp.com",
  projectId: "jokshu-voting",
  storageBucket: "jokshu-voting.firebasestorage.app",
  messagingSenderId: "617567740978",
  appId: "1:617567740978:web:b3b590ab05b616826d082b"
};

// Firebase initialize - safely wrapped in try/catch
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.warn('Firebase initialization failed, falling back to local storage:', error);
}

export { db };
export default app;
