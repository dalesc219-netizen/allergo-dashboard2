import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiPA-DF61ygeebmBhDOxmk-EqXS4JX4wY",
  authDomain: "pollen-control.firebaseapp.com",
  projectId: "pollen-control",
  storageBucket: "pollen-control.firebasestorage.app",
  messagingSenderId: "249934360533",
  appId: "1:249934360533:web:f6ab1538a49635599ad75c"
};

// Инициализируем приложение и экспортируем базу данных
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
