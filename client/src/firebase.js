// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ,
    authDomain: "mern-estate-a5944.firebaseapp.com",
    projectId: "mern-estate-a5944",
    storageBucket: "mern-estate-a5944.appspot.com",
    messagingSenderId: "966530358090",
    appId: "1:966530358090:web:f33e1c79a713ba19a5bfb3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);