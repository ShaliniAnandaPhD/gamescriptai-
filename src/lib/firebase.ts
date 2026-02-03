import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBWffnaHQ7wJQ6yfUSPxxZCB2LmJz4_ihQ",
    authDomain: "neuron-newsroom-live-2026.firebaseapp.com",
    projectId: "neuron-newsroom-live-2026",
    storageBucket: "neuron-newsroom-live-2026.firebasestorage.app",
    messagingSenderId: "324819296470",
    appId: "1:324819296470:web:78dabf1269581039696977"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
