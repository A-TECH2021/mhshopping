import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-cf1e8.firebaseapp.com",
  projectId: "reactchat-cf1e8",
  storageBucket: "reactchat-cf1e8.appspot.com",
  messagingSenderId: "765763095941",
  appId: "1:765763095941:web:e3c61cff2a3d250fc308ec"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth() 
export const db = getFirestore()
export const storage = getStorage() 

