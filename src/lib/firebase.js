
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 사용자 요청에 따라 추출된 실제 Firebase 키를 적용합니다.
const firebaseConfig = {
    apiKey: "AIzaSyAsbaWbo3DoSTrRFhkaf9XujWPpmeGSjAE",
    authDomain: "bg3-raid-manager.firebaseapp.com",
    projectId: "bg3-raid-manager",
    storageBucket: "bg3-raid-manager.firebasestorage.app",
    messagingSenderId: "773826713403",
    appId: "1:773826713403:web:c15fdfca708d47f4fcc91e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const isConfigured = true;

console.log("🔥 Firebase Connected (Real DB Mode)");
