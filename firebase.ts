
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase Consoleから取得した設定値を反映しました。
 */
const firebaseConfig = {
  apiKey: "AIzaSyDkfDMM2Gag8CHWuzM6QX2DuzkO3z4eE6g", 
  authDomain: "nanachan-com.firebaseapp.com",
  projectId: "nanachan-com",
  storageBucket: "nanachan-com.firebasestorage.app",
  messagingSenderId: "75961234338",
  appId: "1:75961234338:web:146f489c53f231272238fb",
  measurementId: "G-VD344WK6WD"
};

// 環境変数がある場合はそちらを優先し、ない場合は上記の設定を使用します
const config = {
  apiKey: process.env.FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || firebaseConfig.appId,
};

// Fix for initializeApp missing member error by ensuring correct modular SDK call
const app = initializeApp(config);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Re-export auth functions to resolve "no exported member" errors in other files
export { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
};
