import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({
    apiKey: "AIzaSyBUydPZ7nI8KOraLTxTrP76gsebe1Slhp4",
    authDomain: "vide-no.firebaseapp.com",
    projectId: "vide-no",
    storageBucket: "vide-no.appspot.com",
    messagingSenderId: "870712648994",
    appId: "1:870712648994:web:23f2eeb369ae689611f17b"
});

export const firestore = getFirestore(app);