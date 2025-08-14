import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjSXmDuT38jMdrvba5Mu7nuCrRMTjsOCk",
  authDomain: "onlineexamtoo.firebaseapp.com",
  projectId: "onlineexamtoo",
  storageBucket: "onlineexamtoo.appspot.com",
  messagingSenderId: "896591083622",
  appId: "1:896591083622:web:f43a990ecc86166e65d5a7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
