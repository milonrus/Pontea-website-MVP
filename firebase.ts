import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyByhln6E1DyzLFkZvBnQnU2FVQWjsc6kUI",
  authDomain: "pontea-lab-2.firebaseapp.com",
  projectId: "pontea-lab-2",
  storageBucket: "pontea-lab-2.firebasestorage.app",
  messagingSenderId: "459565128634",
  appId: "1:459565128634:web:78579c98109f2cfc285b83"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);