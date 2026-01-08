import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBQabTWeZkhvtBe6_YKBv4mGdPfrWeU4ro",
  authDomain: "edutask-eed99.firebaseapp.com",
  projectId: "edutask-eed99",
  storageBucket: "edutask-eed99.firebasestorage.app",
  messagingSenderId: "597188434856",
  appId: "1:597188434856:web:706a8d55f8520815539b9d",
  measurementId: "G-C0TN12ELB3"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
