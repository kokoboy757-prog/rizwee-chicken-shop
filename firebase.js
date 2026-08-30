import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCo6ITJxCWLF4TP_lQlZRt-YEMwF_hoiDo",
  authDomain: "rizwee-brothers-chicken-shop.firebaseapp.com",
  databaseURL:
    "https://rizwee-brothers-chicken-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rizwee-brothers-chicken-shop",
  storageBucket: "rizwee-brothers-chicken-shop.firebasestorage.app",
  messagingSenderId: "452814450510",
  appId: "1:452814450510:android:13d1cf125d9a6719d4381f",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
export const auth = getAuth(app);
export default app;
