import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkfDMM2Gag8CHWuzM6QX2DuzkO3z4eE6g",
  authDomain: "nanachan-com.firebaseapp.com",
  projectId: "nanachan-com",
  storageBucket: "nanachan-com.firebasestorage.app",
  messagingSenderId: "75961234338",
  appId: "1:75961234338:web:146f489c53f231272238fb",
  measurementId: "G-VD344WK6WD"
};

// Firebaseを初期化する
const app = initializeApp(firebaseConfig);
// データベースを使う準備
export const db = getFirestore(app);
