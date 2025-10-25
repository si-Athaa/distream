// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// GANTI ISI CONFIG INI DENGAN PUNYAMU
const firebaseConfig = {
  apiKey: "AIzaSyBVTYn9PwXSM3g7FEIWWVgkeh-86N7LOEU",
  authDomain: "dischat-8284.firebaseapp.com",
  projectId: "dischat-8284",
  storageBucket: "dischat-8284.firebasestorage.app",
  messagingSenderId: "348125258399",
  appId: "1:348125258399:web:1cdbd6cb89580e80eff8aa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
